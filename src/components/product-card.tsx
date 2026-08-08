import Link from "next/link";
import Image from "next/image";
import { ProductCardData } from "@/lib/catalog";
import { FitmentVerdict } from "@/lib/fitment";
import { effectivePriceCents, formatZar, isOnSale } from "@/lib/money";
import { FitmentBadge } from "./fitment-badge";
import { AddToCartButton } from "./add-to-cart";
import { CompareToggle } from "./compare";

export function ProductCard({ product, verdict }: { product: ProductCardData; verdict?: FitmentVerdict }) {
  const price = effectivePriceCents(product);
  const sale = isOnSale(product);
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";
  const needsVerification =
    product.requiresFitmentCheck &&
    verdict != null &&
    verdict.status !== "CONFIRMED" &&
    verdict.status !== "UNIVERSAL";
  const notCompatible = verdict?.status === "NOT_COMPATIBLE";

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-ink-800 bg-ink-900 transition-colors hover:border-ink-600">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-ink-850">
        <Image
          src={product.images[0]?.url ?? "/products/engines-components.svg"}
          alt={product.images[0]?.alt ?? product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {sale && (
          <span className="absolute left-2 top-2 rounded bg-race-600 px-2 py-0.5 text-xs font-bold uppercase text-white">Sale</span>
        )}
        {product.stockStatus === "IN_STOCK" && (
          <span className="absolute right-2 top-2 rounded bg-emerald-900/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">In stock</span>
        )}
        {product.stockStatus === "BACKORDER" && (
          <span className="absolute right-2 top-2 rounded bg-ink-800/90 px-2 py-0.5 text-[11px] font-semibold text-steel-300">Backorder</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-steel-400">
          {product.brand?.name ?? "—"}{product.sku ? <span className="font-normal normal-case"> · {product.sku}</span> : null}
        </p>
        <h3 className="min-h-10 text-sm font-semibold leading-snug text-paper-50">
          <Link href={`/products/${product.slug}`} className="hover:text-white hover:underline">{product.name}</Link>
        </h3>
        {verdict && <FitmentBadge verdict={verdict} small />}
        <div className="mt-auto flex items-baseline justify-between gap-2">
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-paper-50">{formatZar(price)}</span>
            {sale && <span className="text-sm text-steel-400 line-through">{formatZar(product.regularPriceCents)}</span>}
          </span>
          <CompareToggle slug={product.slug} name={product.name} />
        </div>
        {notCompatible ? (
          <p className="rounded border border-race-700 bg-race-700/10 px-2 py-1.5 text-center text-xs font-semibold text-race-500">
            Not compatible with your vehicle
          </p>
        ) : (
          <AddToCartButton
            productId={product.id}
            disabled={outOfStock}
            requiresVerification={needsVerification}
            verificationWarning={verdict?.detail ?? undefined}
          />
        )}
      </div>
    </article>
  );
}
