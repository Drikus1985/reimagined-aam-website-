import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPayfastConfig, postbackValidate, verifyItnPayload } from "@/lib/payfast";
import { markOrderPaid } from "@/lib/orders";

/**
 * PayFast ITN (Instant Transaction Notification) webhook.
 * Verification: signature -> merchant id -> stored amount -> server postback
 * (postback skipped in sandbox when unreachable). Always returns 200 OK to
 * PayFast per their spec once the payload has been recorded.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const payload: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(raw)) payload[k] = v;

  const cfg = getPayfastConfig();

  const orderId = payload.m_payment_id;
  const order = orderId ? await prisma.order.findUnique({ where: { id: orderId } }) : null;

  const verification = verifyItnPayload(payload, cfg, order?.totalCents);

  await prisma.auditLog.create({
    data: {
      actor: "system",
      action: "payfast.itn",
      entity: "Order",
      entityId: orderId ?? null,
      meta: {
        valid: verification.valid,
        reason: verification.valid ? undefined : verification.reason,
        payment_status: payload.payment_status,
        pf_payment_id: payload.pf_payment_id,
      },
    },
  });

  if (!verification.valid || !order) {
    // Acknowledge receipt; the audit log captures why it was rejected.
    return new NextResponse("OK", { status: 200 });
  }

  // Server-to-server confirmation with PayFast (best effort in sandbox).
  const postbackOk = await postbackValidate(payload, cfg);
  if (!postbackOk && cfg.sandbox === false) {
    // In production an unconfirmed ITN leaves the order awaiting payment.
    return new NextResponse("OK", { status: 200 });
  }

  if (verification.paymentStatus === "COMPLETE") {
    await markOrderPaid(order.id, verification.pfPaymentId);
  } else if (verification.paymentStatus === "CANCELLED" || verification.paymentStatus === "FAILED") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAYMENT_FAILED" },
    });
  }

  return new NextResponse("OK", { status: 200 });
}
