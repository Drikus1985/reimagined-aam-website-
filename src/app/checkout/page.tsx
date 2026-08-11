import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCart, priceCart } from "@/lib/cart";
import { formatZar } from "@/lib/money";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const priced = await priceCart(await getCart());
  if (priced.lines.filter((l) => l.available).length === 0) redirect("/basket");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="headline text-3xl text-paper-50">Checkout</h1>
      <div className="rule-red mt-2" />
      <p className="mt-2 text-sm text-steel-300">
        Guest checkout — no account needed. Payment is processed securely by PayFast.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <CheckoutForm />

        <aside className="h-fit rounded-lg border border-ink-800 bg-ink-900 p-5 lg:order-last">
          <h2 className="headline text-lg text-paper-50">Your order</h2>
          <ul className="mt-3 divide-y divide-ink-800 text-sm">
            {priced.lines.filter((l) => l.available).map((l) => (
              <li key={l.productId} className="flex justify-between gap-3 py-2">
                <span className="text-paper-100">
                  {l.name} <span className="text-steel-400">× {l.qty}</span>
                </span>
                <span className="shrink-0 font-semibold text-paper-50">{formatZar(l.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-ink-700 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-steel-300">Subtotal</dt>
              <dd className="font-semibold text-paper-50">{formatZar(priced.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel-300">Delivery</dt>
              <dd className="text-steel-300">calculated from your address</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-steel-400">
            Prices and stock are re-validated on our server when you pay.{" "}
            <Link href="/basket" className="text-race-500 hover:underline">Edit basket</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
