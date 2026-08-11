/** All prices are stored as integer cents in ZAR. */

export function formatZar(cents: number): string {
  const rand = cents / 100;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: rand % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rand);
}

/** Effective price respecting sale price when lower than regular. */
export function effectivePriceCents(p: { regularPriceCents: number; salePriceCents: number | null }): number {
  if (p.salePriceCents != null && p.salePriceCents > 0 && p.salePriceCents < p.regularPriceCents) {
    return p.salePriceCents;
  }
  return p.regularPriceCents;
}

export function isOnSale(p: { regularPriceCents: number; salePriceCents: number | null }): boolean {
  return p.salePriceCents != null && p.salePriceCents > 0 && p.salePriceCents < p.regularPriceCents;
}
