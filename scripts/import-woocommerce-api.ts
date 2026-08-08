/**
 * Authorised WooCommerce REST API importer.
 *
 * Requires read-only API credentials created by the store owner
 * (WooCommerce → Settings → Advanced → REST API):
 *   WOO_BASE_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET in .env
 *
 * Usage:
 *   npx tsx scripts/import-woocommerce-api.ts
 *   npx tsx scripts/import-catalog.ts data/import/products.normalized.json --replace-sample
 */

import fs from "node:fs";
import path from "node:path";
import { NormalizedProduct, dedupeProducts, parsePriceToCents, qualityCheck, slugify, stripHtml } from "./lib/normalize";

const BASE = process.env.WOO_BASE_URL?.replace(/\/$/, "");
const KEY = process.env.WOO_CONSUMER_KEY;
const SECRET = process.env.WOO_CONSUMER_SECRET;

if (!BASE || !KEY || !SECRET) {
  console.error("Set WOO_BASE_URL, WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET in .env");
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), "data", "import");
fs.mkdirSync(OUT_DIR, { recursive: true });

type WooProduct = {
  id: number; name: string; slug: string; sku: string; permalink: string;
  regular_price: string; sale_price: string; stock_status: string; stock_quantity: number | null;
  short_description: string; description: string; weight: string;
  dimensions: { length: string; width: string; height: string };
  categories: { name: string }[]; images: { src: string; alt: string }[];
  attributes: { name: string; options: string[] }[];
  related_ids: number[]; cross_sell_ids: number[]; upsell_ids: number[];
  status: string; brands?: { name: string }[];
};

async function fetchPage(page: number): Promise<WooProduct[]> {
  const url = `${BASE}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish`;
  const auth = Buffer.from(`${KEY}:${SECRET}`).toString("base64");
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok) throw new Error(`WooCommerce API ${res.status}: ${await res.text()}`);
  return (await res.json()) as WooProduct[];
}

async function main() {
  const all: WooProduct[] = [];
  for (let page = 1; page <= 50; page++) {
    const batch = await fetchPage(page);
    all.push(...batch);
    console.log(`Fetched page ${page}: ${batch.length} products (total ${all.length})`);
    if (batch.length < 100) break;
    await new Promise((r) => setTimeout(r, 1000)); // be gentle with the live store
  }

  const idToSlug = new Map(all.map((p) => [p.id, slugify(p.slug || p.name)]));

  const products: NormalizedProduct[] = all.map((p) => {
    const attributes: Record<string, string> = {};
    for (const a of p.attributes ?? []) attributes[a.name] = a.options.join(", ");
    const weightKg = parseFloat(p.weight);
    return {
      sourceType: "WOO_IMPORT" as const,
      sourceUrl: p.permalink,
      slug: slugify(p.slug || p.name),
      name: p.name,
      sku: p.sku || undefined,
      regularPriceCents: parsePriceToCents(p.regular_price),
      salePriceCents: parsePriceToCents(p.sale_price),
      stockStatus:
        p.stock_status === "instock" ? ("IN_STOCK" as const)
        : p.stock_status === "onbackorder" ? ("BACKORDER" as const)
        : ("OUT_OF_STOCK" as const),
      stockQty: p.stock_quantity ?? undefined,
      shortDescription: stripHtml(p.short_description),
      description: stripHtml(p.description),
      categories: p.categories.map((c) => c.name),
      brand: p.brands?.[0]?.name ?? attributes["Brand"] ?? undefined,
      images: p.images.map((i) => ({ url: i.src, alt: i.alt || undefined })),
      attributes: Object.keys(attributes).length ? attributes : undefined,
      weightGrams: Number.isFinite(weightKg) ? Math.round(weightKg * 1000) : undefined,
      relatedSlugs: p.related_ids.map((id) => idToSlug.get(id)).filter((s): s is string => !!s),
      crossSellSlugs: p.cross_sell_ids.map((id) => idToSlug.get(id)).filter((s): s is string => !!s),
      upsellSlugs: p.upsell_ids.map((id) => idToSlug.get(id)).filter((s): s is string => !!s),
    };
  });

  const { kept, duplicates } = dedupeProducts(products);
  const issues = qualityCheck(kept);

  const outFile = path.join(OUT_DIR, "products.normalized.json");
  fs.writeFileSync(outFile, JSON.stringify(kept, null, 2));
  fs.writeFileSync(
    path.join(OUT_DIR, "import-quality-report.md"),
    [
      `# WooCommerce API import quality report — ${new Date().toISOString()}`,
      `- Products fetched: ${all.length}`,
      `- Kept after dedupe: ${kept.length} (${duplicates.length} duplicates)`,
      `- Quality issues: ${issues.length}`,
      "",
      ...issues.map((i) => `- \`${i.slug}\`: ${i.issue}`),
    ].join("\n"),
  );
  console.log(`Wrote ${kept.length} products → ${outFile}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
