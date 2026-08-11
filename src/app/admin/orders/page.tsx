import { prisma } from "@/lib/db";
import { formatZar } from "@/lib/money";
import { updateOrderStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 100,
  });

  return (
    <div className="space-y-3">
      {orders.length === 0 && <p className="rounded border border-ink-800 bg-ink-900 p-4 text-sm text-steel-300">No orders yet.</p>}
      {orders.map((o) => (
        <details key={o.id} className="rounded-lg border border-ink-800 bg-ink-900">
          <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <strong className="text-paper-50">{o.orderNumber}</strong>
            <span className="text-steel-300">{o.firstName} {o.lastName} · {o.email}</span>
            <span className="ml-auto font-semibold text-paper-50">{formatZar(o.totalCents)}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-bold ${o.status === "PAID" ? "bg-emerald-900 text-emerald-300" : o.status === "AWAITING_PAYMENT" ? "bg-amber-950 text-amber-300" : "bg-ink-800 text-steel-300"}`}>
              {o.status}
            </span>
          </summary>
          <div className="border-t border-ink-800 px-4 py-3 text-sm">
            <ul className="space-y-1">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span className="text-paper-100">{i.nameSnapshot} × {i.quantity} {i.skuSnapshot ? <span className="text-steel-400">({i.skuSnapshot})</span> : null}</span>
                  <span className="text-paper-50">{formatZar(i.lineTotalCents)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-steel-300">
              {o.deliveryMethod === "COURIER"
                ? `Deliver: ${[o.addressLine1, o.addressLine2, o.suburb, o.city, o.province, o.postalCode].filter(Boolean).join(", ")}`
                : "Collection from workshop"}
              {" · "}Shipping {formatZar(o.shippingCents)} · Phone {o.phone}
              {o.payfastPaymentId ? ` · PayFast ${o.payfastPaymentId}` : ""}
            </p>
            {o.customerNote && <p className="mt-1 text-steel-400">Note: {o.customerNote}</p>}
            <form action={updateOrderStatus} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="id" value={o.id} />
              <select name="status" defaultValue={o.status} className="rounded border border-ink-700 bg-ink-950 px-2 py-1.5 text-paper-50">
                {["PENDING", "AWAITING_PAYMENT", "PAID", "PAYMENT_FAILED", "CANCELLED", "FULFILLED"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="rounded bg-race-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-race-700">Update</button>
            </form>
          </div>
        </details>
      ))}
    </div>
  );
}
