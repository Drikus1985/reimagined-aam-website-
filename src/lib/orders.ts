import { prisma } from "./db";
import { CartLine, priceCart } from "./cart";
import { getShippingQuotes, COLLECTION_OPTION, ShippingAddress } from "./shipping";
import { z } from "zod";

export const checkoutSchema = z.object({
  email: z.string().email().max(200),
  phone: z.string().min(7).max(20).regex(/^[+0-9 ()-]+$/, "Enter a valid phone number"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  deliveryMethod: z.enum(["COURIER", "COLLECTION"]),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  suburb: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  province: z
    .enum([
      "Gauteng",
      "Western Cape",
      "KwaZulu-Natal",
      "Eastern Cape",
      "Free State",
      "Limpopo",
      "Mpumalanga",
      "North West",
      "Northern Cape",
    ])
    .optional(),
  postalCode: z.string().regex(/^\d{4}$/, "South African postal codes are 4 digits").optional(),
  customerNote: z.string().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (data.deliveryMethod === "COURIER") {
    for (const field of ["addressLine1", "suburb", "city", "province", "postalCode"] as const) {
      if (!data[field]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "Required for courier delivery" });
      }
    }
  }
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

function generateOrderNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AAM-${t}-${r}`;
}

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNumber: string; totalCents: number }
  | { ok: false; error: string; issues?: string[] };

/**
 * Create an order with fully server-side validation: prices, stock and
 * shipping are computed from the database and providers — client-supplied
 * amounts are never trusted.
 */
export async function createOrder(cartLines: CartLine[], input: CheckoutInput): Promise<CreateOrderResult> {
  const priced = await priceCart(cartLines);
  const orderable = priced.lines.filter((l) => l.available);
  if (orderable.length === 0) {
    return { ok: false, error: "Your basket has no orderable items.", issues: priced.issues };
  }
  if (priced.issues.length > 0) {
    return { ok: false, error: "Your basket changed — please review before paying.", issues: priced.issues };
  }

  let shippingCents = 0;
  if (input.deliveryMethod === "COURIER") {
    const address: ShippingAddress = {
      city: input.city!,
      province: input.province!,
      postalCode: input.postalCode!,
      suburb: input.suburb,
    };
    const quotes = await getShippingQuotes(address, priced.totalWeightGrams, priced.subtotalCents);
    if (quotes.length === 0) return { ok: false, error: "We could not get a delivery quote for your address." };
    shippingCents = quotes[0].amountCents;
  } else {
    shippingCents = COLLECTION_OPTION.amountCents;
  }

  const totalCents = priced.subtotalCents + shippingCents;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      status: "AWAITING_PAYMENT",
      email: input.email,
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      suburb: input.suburb,
      city: input.city,
      province: input.province,
      postalCode: input.postalCode,
      deliveryMethod: input.deliveryMethod,
      subtotalCents: priced.subtotalCents,
      shippingCents,
      totalCents,
      customerNote: input.customerNote,
      items: {
        create: orderable.map((l) => ({
          productId: l.productId,
          nameSnapshot: l.name,
          skuSnapshot: l.sku,
          unitPriceCents: l.unitPriceCents,
          quantity: l.qty,
          lineTotalCents: l.lineTotalCents,
        })),
      },
    },
  });

  return { ok: true, orderId: order.id, orderNumber: order.orderNumber, totalCents };
}

/** Mark an order paid after a verified ITN; decrement stock atomically. */
export async function markOrderPaid(orderId: string, pfPaymentId: string): Promise<void> {
  let becamePaid = false;
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status === "PAID" || order.status === "FULFILLED") return;
    becamePaid = true;
    await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", payfastPaymentId: pfPaymentId, paidAt: new Date() },
    });
    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.updateMany({
        where: { id: item.productId, stockQty: { gte: item.quantity } },
        data: { stockQty: { decrement: item.quantity } },
      });
    }
    await tx.auditLog.create({
      data: { actor: "system", action: "order.paid", entity: "Order", entityId: orderId, meta: { pfPaymentId } },
    });
  });
  if (becamePaid) {
    // Outside the transaction: email failure must never roll back a payment.
    const { sendOrderPaidEmails } = await import("./email");
    await sendOrderPaidEmails(orderId);
  }
}
