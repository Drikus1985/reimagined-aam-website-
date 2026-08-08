import { prisma } from "../db";
import { effectivePriceCents } from "../money";
import { verdictsForProducts } from "../catalog";
import { GarageVehicle } from "../fitment";
import { GroundedProduct } from "./types";

const PRODUCT_TOKEN = /\[product:([a-z0-9-]+)\]/gi;

/**
 * Grounding guard: resolve every [product:slug] token in assistant text
 * against the live catalogue. Tokens that don't resolve (fabricated or
 * inactive products) are stripped from the text and never displayed.
 * Additionally, only slugs surfaced by catalogue tools in this conversation
 * are allowed through (defence against injected slugs in tool results).
 */
export async function groundAssistantText(
  text: string,
  allowedSlugs: Set<string>,
  vehicle: GarageVehicle | null,
): Promise<{ text: string; products: GroundedProduct[] }> {
  const mentioned: string[] = [];
  for (const match of text.matchAll(PRODUCT_TOKEN)) {
    const slug = match[1].toLowerCase();
    if (!mentioned.includes(slug)) mentioned.push(slug);
  }

  const candidates = mentioned.filter((s) => allowedSlugs.has(s));
  const rows = candidates.length
    ? await prisma.product.findMany({
        where: { slug: { in: candidates }, status: "ACTIVE" },
        include: { brand: true, images: { orderBy: { position: "asc" }, take: 1 } },
      })
    : [];
  const bySlug = new Map(rows.map((p) => [p.slug, p]));
  const verdicts = await verdictsForProducts(rows.map((p) => p.id), vehicle);

  const products: GroundedProduct[] = [];
  for (const slug of mentioned) {
    const p = bySlug.get(slug);
    if (!p) continue;
    const v = verdicts.get(p.id);
    products.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      brand: p.brand?.name ?? null,
      priceCents: effectivePriceCents(p),
      stockStatus: p.stockStatus,
      stockQty: p.stockQty,
      imageUrl: p.images[0]?.url ?? null,
      fitmentStatus: v?.status ?? "UNKNOWN",
      fitmentLabel: v?.label ?? "Compatibility unknown",
      fitmentDetail: v?.detail,
    });
  }

  // Replace resolved tokens with the product name; strip unresolved tokens.
  const cleaned = text.replace(PRODUCT_TOKEN, (full, slugRaw: string) => {
    const p = bySlug.get(slugRaw.toLowerCase());
    return p ? `**${p.name}**` : "";
  }).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  return { text: cleaned, products };
}
