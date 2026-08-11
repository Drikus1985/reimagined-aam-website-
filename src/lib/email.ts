import nodemailer from "nodemailer";
import { prisma } from "./db";
import { formatZar } from "./money";

/**
 * Transactional email. Configured entirely via SMTP_* env vars; when they are
 * absent every send is a graceful no-op recorded in the audit log, so checkout
 * and lead capture never depend on a mail server being up.
 */

function getTransport(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
      : undefined,
  });
}

export async function sendMail(opts: { to: string; subject: string; text: string }): Promise<boolean> {
  const transport = getTransport();
  const from = process.env.SMTP_FROM ?? "All American Muscle <parts@allamericanmuscle.co.za>";
  if (!transport) {
    await prisma.auditLog.create({
      data: { actor: "system", action: "email.skipped_not_configured", meta: { to: opts.to, subject: opts.subject } },
    });
    return false;
  }
  try {
    await transport.sendMail({ from, to: opts.to, subject: opts.subject, text: opts.text });
    await prisma.auditLog.create({
      data: { actor: "system", action: "email.sent", meta: { to: opts.to, subject: opts.subject } },
    });
    return true;
  } catch (err) {
    await prisma.auditLog.create({
      data: {
        actor: "system",
        action: "email.failed",
        meta: { to: opts.to, subject: opts.subject, error: err instanceof Error ? err.message : "unknown" },
      },
    });
    return false;
  }
}

export async function sendOrderPaidEmails(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;

  const lines = order.items
    .map((i) => `  ${i.nameSnapshot} × ${i.quantity} — ${formatZar(i.lineTotalCents)}`)
    .join("\n");
  const deliveryBlock =
    order.deliveryMethod === "COURIER"
      ? `Delivery to:\n  ${[order.addressLine1, order.addressLine2, order.suburb, order.city, order.province, order.postalCode].filter(Boolean).join(", ")}`
      : "Collection from our workshop: 15 Tarry Road, Alrode South, Alberton. We'll let you know when it's ready (usually within 1 working day).";

  await sendMail({
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed — All American Muscle`,
    text: `Hi ${order.firstName},

Thanks — payment for order ${order.orderNumber} has been received.

${lines}
  Delivery: ${formatZar(order.shippingCents)}
  Total: ${formatZar(order.totalCents)}

${deliveryBlock}

Questions? Reply to this email, call 010 592 1706, or WhatsApp 072 042 6477.

All American Muscle (Pty) Ltd
15 Tarry Road, Alrode South, Alberton
`,
  });

  const staffTo = process.env.ORDERS_NOTIFY_EMAIL ?? process.env.SMTP_FROM;
  if (staffTo) {
    await sendMail({
      to: staffTo,
      subject: `PAID: ${order.orderNumber} — ${formatZar(order.totalCents)} (${order.deliveryMethod})`,
      text: `Order ${order.orderNumber} is paid.\n\n${lines}\n\nCustomer: ${order.firstName} ${order.lastName}, ${order.phone}, ${order.email}\n${deliveryBlock}\n\nManage: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders`,
    });
  }
}

export async function sendLeadNotification(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;
  const staffTo = process.env.LEADS_NOTIFY_EMAIL ?? process.env.ORDERS_NOTIFY_EMAIL ?? process.env.SMTP_FROM;
  if (!staffTo) return;
  await sendMail({
    to: staffTo,
    subject: `New ${lead.type} enquiry — ${lead.name}`,
    text: `Type: ${lead.type}\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone ?? "—"}\nVehicle: ${lead.vehicle ?? "—"}\n\n${lead.message}\n\nManage: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/leads`,
  });
}
