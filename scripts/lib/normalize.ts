/**
 * Normalised catalogue record shared by all import sources (crawler,
 * WooCommerce CSV, WooCommerce REST API). scripts/import-catalog.ts consumes
 * this shape and loads it into the database.
 */

export type NormalizedProduct = {
  sourceUrl?: string;
  sourceType: "SCRAPED" | "WOO_IMPORT";
  slug: string;
  name: string;
  sku?: string;
  regularPriceCents?: number;
  salePriceCents?: number;
  stockStatus?: "IN_STOCK" | "OUT_OF_STOCK" | "BACKORDER";
  stockQty?: number;
  shortDescription?: string;
  description?: string;
  categories: string[]; // names or slugs; hierarchy with ">" separators supported
  brand?: string;
  images: { url: string; alt?: string }[];
  attributes?: Record<string, string>;
  weightGrams?: number;
  dimensionsMm?: { l?: number; w?: number; h?: number };
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  relatedSlugs?: string[];
  crossSellSlugs?: string[];
  upsellSlugs?: string[];
};

export type QualityIssue = { slug: string; issue: string };

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function parsePriceToCents(raw: string | number | undefined | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const num = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(num) || num < 0) return undefined;
  return Math.round(num * 100);
}

/** Strip HTML to safe plain text (imported descriptions are stored as text). */
export function stripHtml(html: string | undefined | null): string | undefined {
  if (!html) return undefined;
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Detect engine-family tags from free text using the alias dictionary. */
const ENGINE_HINTS: [string, RegExp][] = [
  ["small-block-chevy", /\b(sbc|small[ -]?block chev|350 chev|1955-86 small|265|283|327|305)\b/i],
  ["big-block-chevy", /\b(bbc|big[ -]?block chev|396|454|427 chev)\b/i],
  ["ford-windsor", /\b(sbf|windsor|289|302|351w|small[ -]?block ford)\b/i],
  ["ford-cleveland", /\b(cleveland|351c)\b/i],
  ["ford-fe", /\b(ford fe|390 ford|428)\b/i],
  ["gm-ls", /\b(ls1|ls2|ls3|lsx|gen ?(iii|iv))\b/i],
  ["mopar-la", /\b(318|340|360 mopar|la series)\b/i],
  ["mopar-b-rb", /\b(383 mopar|440|426 wedge|b\/rb)\b/i],
  ["mopar-hemi", /\b(hemi)\b/i],
];

export function detectEngineFamilies(text: string): string[] {
  return ENGINE_HINTS.filter(([, re]) => re.test(text)).map(([slug]) => slug);
}

/** Dedupe by SKU first, then by normalised name. Returns kept + dropped report. */
export function dedupeProducts(products: NormalizedProduct[]): {
  kept: NormalizedProduct[];
  duplicates: { kept: string; dropped: string; reason: string }[];
} {
  const bySku = new Map<string, NormalizedProduct>();
  const byName = new Map<string, NormalizedProduct>();
  const kept: NormalizedProduct[] = [];
  const duplicates: { kept: string; dropped: string; reason: string }[] = [];

  for (const p of products) {
    const skuKey = p.sku?.trim().toUpperCase();
    const nameKey = p.name.trim().toLowerCase().replace(/\s+/g, " ");
    if (skuKey && bySku.has(skuKey)) {
      duplicates.push({ kept: bySku.get(skuKey)!.slug, dropped: p.slug, reason: `duplicate SKU ${skuKey}` });
      continue;
    }
    if (byName.has(nameKey)) {
      duplicates.push({ kept: byName.get(nameKey)!.slug, dropped: p.slug, reason: "duplicate name" });
      continue;
    }
    if (skuKey) bySku.set(skuKey, p);
    byName.set(nameKey, p);
    kept.push(p);
  }
  return { kept, duplicates };
}

export function qualityCheck(products: NormalizedProduct[]): QualityIssue[] {
  const issues: QualityIssue[] = [];
  for (const p of products) {
    if (!p.sku) issues.push({ slug: p.slug, issue: "missing SKU" });
    if (p.regularPriceCents == null) issues.push({ slug: p.slug, issue: "missing price" });
    if (p.images.length === 0) issues.push({ slug: p.slug, issue: "no images" });
    if (!p.description || p.description.length < 80) issues.push({ slug: p.slug, issue: "weak/missing description" });
    if (p.categories.length === 0) issues.push({ slug: p.slug, issue: "uncategorised" });
    if (!p.brand) issues.push({ slug: p.slug, issue: "missing brand" });
    if (detectEngineFamilies(`${p.name} ${p.description ?? ""}`).length === 0) {
      issues.push({ slug: p.slug, issue: "no engine-family/fitment signal detected — fitment data uncertain" });
    }
  }
  return issues;
}
