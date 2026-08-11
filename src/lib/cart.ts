import { cookies } from "next/headers";
import { prisma } from "./db";
import { effectivePriceCents } from "./money";

export const CART_COOKIE = "aam_cart";
export const MAX_LINES = 50;
export const MAX_QTY = 99;

export type CartLine = { productId: string; qty: number };

export function parseCart(raw: string | undefined): CartLine[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (l): l is CartLine =>
          l && typeof l.productId === "string" && Number.isInteger(l.qty) && l.qty > 0,
      )
      .map((l) => ({ productId: l.productId, qty: Math.min(l.qty, MAX_QTY) }))
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify(lines.slice(0, MAX_LINES));
}

export async function getCart(): Promise<CartLine[]> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

export type PricedLine = {
  productId: string;
  slug: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  unitPriceCents: number;
  qty: number;
  lineTotalCents: number;
  stockStatus: string;
  stockQty: number | null;
  weightGrams: number | null;
  requiresFitmentCheck: boolean;
  safetyCritical: boolean;
  available: boolean;
  adjusted?: string; // human-readable note when qty was capped or item dropped
};

export type PricedCart = {
  lines: PricedLine[];
  subtotalCents: number;
  totalWeightGrams: number;
  issues: string[];
};

/**
 * Server-side pricing and stock validation. Never trusts client prices —
 * every line is re-priced from the database, quantities capped to stock.
 */
export async function priceCart(lines: CartLine[]): Promise<PricedCart> {
  const issues: string[] = [];
  if (lines.length === 0) return { lines: [], subtotalCents: 0, totalWeightGrams: 0, issues };

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, status: "ACTIVE" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const priced: PricedLine[] = [];
  for (const line of lines) {
    const p = byId.get(line.productId);
    if (!p) {
      issues.push("An item in your basket is no longer available and was removed.");
      continue;
    }
    let qty = Math.min(line.qty, MAX_QTY);
    let adjusted: string | undefined;
    const available = p.stockStatus === "IN_STOCK" || p.stockStatus === "BACKORDER" || p.stockStatus === "PREORDER";
    if (p.stockStatus === "OUT_OF_STOCK") {
      issues.push(`"${p.name}" is out of stock and cannot be ordered right now.`);
    } else if (p.stockStatus === "IN_STOCK" && p.stockQty != null && qty > p.stockQty) {
      qty = Math.max(1, p.stockQty);
      adjusted = `Quantity reduced to available stock (${p.stockQty}).`;
      issues.push(`"${p.name}": ${adjusted}`);
    }
    const unit = effectivePriceCents(p);
    priced.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      imageUrl: p.images[0]?.url ?? null,
      unitPriceCents: unit,
      qty,
      lineTotalCents: unit * qty,
      stockStatus: p.stockStatus,
      stockQty: p.stockQty,
      weightGrams: p.weightGrams,
      requiresFitmentCheck: p.requiresFitmentCheck,
      safetyCritical: p.safetyCritical,
      available: available && p.stockStatus !== "OUT_OF_STOCK",
      adjusted,
    });
  }

  const orderable = priced.filter((l) => l.available);
  return {
    lines: priced,
    subtotalCents: orderable.reduce((s, l) => s + l.lineTotalCents, 0),
    totalWeightGrams: orderable.reduce((s, l) => s + (l.weightGrams ?? 1000) * l.qty, 0),
    issues,
  };
}
