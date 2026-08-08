import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatZar } from "@/lib/money";

export const metadata: Metadata = { title: "Order status", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; status?: string }>;
}) {
  const { order: orderNumber, status } = await searchParams;
  const order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } })
    : null;

  const cancelled = status === "cancelled";
  const paid = order?.status === "PAID" || order?.status === "FULFILLED";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      {cancelled ? (
        <>
          <h1 className="headline text-3xl text-paper-50">Payment cancelled</h1>
          <p className="mt-3 text-steel-300">
            No money changed hands. Your order {orderNumber ? <strong className="text-paper-50">{orderNumber}</strong> : null} is saved —
            you can try again from your basket, or contact us if you hit a problem.
          </p>
        </>
      ) : paid ? (
        <>
          <h1 className="headline text-3xl text-emerald-400">Payment received — thank you!</h1>
          <p className="mt-3 text-steel-300">
            Order <strong className="text-paper-50">{order!.orderNumber}</strong> is confirmed. A confirmation will be sent to{" "}
            <strong className="text-paper-50">{order!.email}</strong>.
          </p>
        </>
      ) : (
        <>
          <h1 className="headline text-3xl text-paper-50">Order received</h1>
          <p className="mt-3 text-steel-300">
            {order ? (
              <>Order <strong className="text-paper-50">{order.orderNumber}</strong> has been created and we're waiting for
              PayFast to confirm your payment. This page updates once the confirmation arrives (usually within a minute) —
              refresh to check, or contact us with your order number.</>
            ) : (
              <>We couldn't find that order. If you've just paid, give it a minute and refresh — or contact us.</>
            )}
          </p>
        </>
      )}

      {order && (
        <div className="mx-auto mt-6 max-w-md rounded-lg border border-ink-800 bg-ink-900 p-5 text-left text-sm">
          <ul className="divide-y divide-ink-800">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between py-2">
                <span className="text-paper-100">{item.nameSnapshot} × {item.quantity}</span>
                <span className="font-semibold text-paper-50">{formatZar(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t border-ink-700 pt-2">
            <div className="flex justify-between"><dt className="text-steel-300">Delivery</dt><dd className="text-paper-100">{formatZar(order.shippingCents)}</dd></div>
            <div className="flex justify-between font-bold"><dt className="text-paper-50">Total</dt><dd className="text-paper-50">{formatZar(order.totalCents)}</dd></div>
          </dl>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/shop" className="rounded bg-race-600 px-5 py-2.5 font-bold text-white hover:bg-race-700">Keep shopping</Link>
        <Link href="/contact" className="rounded border border-ink-600 px-5 py-2.5 font-semibold text-paper-100 hover:border-race-600">Contact us</Link>
      </div>
    </div>
  );
}
