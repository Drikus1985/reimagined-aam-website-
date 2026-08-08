import { Metadata } from "next";
import Link from "next/link";
import { getCart, priceCart } from "@/lib/cart";
import { getActiveVehicle } from "@/lib/garage";
import { verdictsForProducts } from "@/lib/catalog";
import { formatZar } from "@/lib/money";
import { BasketLines } from "./basket-lines";
import { AskAiButton } from "@/components/ask-ai-button";

export const metadata: Metadata = { title: "Basket", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function BasketPage() {
  const priced = await priceCart(await getCart());
  const vehicle = await getActiveVehicle();
  const verdicts = await verdictsForProducts(priced.lines.map((l) => l.productId), vehicle);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="headline text-3xl text-paper-50">Basket</h1>
      <div className="rule-red mt-2" />

      {priced.lines.length === 0 ? (
        <div className="mt-10 rounded-lg border border-ink-800 bg-ink-900 p-10 text-center">
          <p className="text-lg font-semibold text-paper-50">Your basket is empty.</p>
          <p className="mt-2 text-steel-300">Time to fix that.</p>
          <Link href="/shop" className="mt-4 inline-block rounded bg-race-600 px-6 py-2.5 font-bold text-white hover:bg-race-700">
            Shop parts
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            {priced.issues.length > 0 && (
              <div className="mb-4 rounded border border-amber-700 bg-amber-950/50 p-3 text-sm text-amber-200" role="alert">
                <ul className="list-inside list-disc space-y-1">
                  {priced.issues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              </div>
            )}
            <BasketLines
              lines={priced.lines.map((l) => ({
                ...l,
                fitment: verdicts.get(l.productId) ?? null,
              }))}
            />
            <div className="mt-4">
              <AskAiButton
                prompt="Please review my basket — check whether everything works together and whether I'm missing any supporting parts."
                label="Ask the AI specialist to review my basket"
              />
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-ink-800 bg-ink-900 p-5">
            <h2 className="headline text-lg text-paper-50">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-steel-300">Subtotal</dt>
                <dd className="font-semibold text-paper-50">{formatZar(priced.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-steel-300">Delivery</dt>
                <dd className="text-steel-300">Quoted at checkout</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-4 block rounded bg-race-600 px-4 py-3 text-center font-bold uppercase tracking-wide text-white hover:bg-race-700"
            >
              Checkout
            </Link>
            <p className="mt-3 text-xs text-steel-400">
              Secure payment via PayFast · guest checkout · nationwide delivery or free collection in Alberton.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
