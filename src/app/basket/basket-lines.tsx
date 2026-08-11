"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { useRouter } from "next/navigation";
import { setCartQty } from "@/lib/client/store";
import { formatZar } from "@/lib/money";
import { FitmentBadge } from "@/components/fitment-badge";
import { FitmentVerdict } from "@/lib/fitment";

type Line = {
  productId: string;
  slug: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  unitPriceCents: number;
  qty: number;
  lineTotalCents: number;
  stockStatus: string;
  available: boolean;
  safetyCritical: boolean;
  fitment: FitmentVerdict | null;
};

export function BasketLines({ lines }: { lines: Line[] }) {
  const router = useRouter();

  const update = (productId: string, qty: number) => {
    setCartQty(productId, qty);
    router.refresh();
  };

  return (
    <ul className="divide-y divide-ink-800 rounded-lg border border-ink-800 bg-ink-900">
      {lines.map((line) => (
        <li key={line.productId} className="flex gap-4 p-4">
          <Link href={`/products/${line.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-ink-850">
            {line.imageUrl && <ProductImage src={line.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/products/${line.slug}`} className="font-semibold text-paper-50 hover:underline">
              {line.name}
            </Link>
            {line.sku && <p className="text-xs text-steel-400">SKU {line.sku}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {line.fitment && line.fitment.status !== "UNKNOWN" && <FitmentBadge verdict={line.fitment} small />}
              {line.safetyCritical && (
                <span className="rounded border border-race-700 bg-race-700/10 px-2 py-0.5 text-[11px] font-semibold text-race-500">
                  Safety-critical — professional fitting advised
                </span>
              )}
              {!line.available && (
                <span className="rounded bg-ink-800 px-2 py-0.5 text-[11px] font-semibold text-steel-300">Unavailable</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center rounded border border-ink-700">
                <button
                  onClick={() => update(line.productId, line.qty - 1)}
                  className="px-3 py-1 text-lg text-steel-300 hover:text-white"
                  aria-label={`Decrease quantity of ${line.name}`}
                >
                  −
                </button>
                <span className="min-w-8 text-center text-sm font-semibold text-paper-50" aria-live="polite">{line.qty}</span>
                <button
                  onClick={() => update(line.productId, line.qty + 1)}
                  className="px-3 py-1 text-lg text-steel-300 hover:text-white"
                  aria-label={`Increase quantity of ${line.name}`}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => update(line.productId, 0)}
                className="text-xs text-steel-400 underline-offset-2 hover:text-race-500 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-paper-50">{formatZar(line.lineTotalCents)}</p>
            {line.qty > 1 && <p className="text-xs text-steel-400">{formatZar(line.unitPriceCents)} each</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
