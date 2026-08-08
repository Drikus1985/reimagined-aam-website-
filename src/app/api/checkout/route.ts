import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema, createOrder } from "@/lib/orders";
import { getCart } from "@/lib/cart";
import { buildPaymentFields, getPayfastConfig, payfastEngineUrl } from "@/lib/payfast";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

/**
 * Create an order from the (server-validated) cart cookie and return the
 * signed PayFast form fields. Prices, stock and shipping are all computed
 * server-side — nothing from the request body affects amounts.
 */
export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req, "checkout"), 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many attempts, please wait a minute." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }

  const cart = await getCart();
  if (cart.length === 0) {
    return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
  }

  const result = await createOrder(cart, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, issues: result.issues }, { status: 409 });
  }

  const cfg = getPayfastConfig();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const fields = buildPaymentFields(
    {
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      amountCents: result.totalCents,
      itemName: `All American Muscle order ${result.orderNumber}`,
      customerFirstName: parsed.data.firstName,
      customerLastName: parsed.data.lastName,
      customerEmail: parsed.data.email,
    },
    cfg,
    siteUrl,
  );

  await prisma.auditLog.create({
    data: { actor: "system", action: "order.created", entity: "Order", entityId: result.orderId, meta: { totalCents: result.totalCents } },
  });

  const res = NextResponse.json({
    ok: true,
    orderNumber: result.orderNumber,
    totalCents: result.totalCents,
    payfast: { action: payfastEngineUrl(cfg), fields },
  });
  // Clear the cart once the order exists.
  res.cookies.set("aam_cart", "[]", { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
  return res;
}
