/**
 * WooCommerce CSV product-export importer.
 *
 * Accepts the standard WooCommerce "Export products" CSV (all columns) and
 * produces the same normalized JSON the crawler produces, so both feed the
 * same loader.
 *
 * Usage:
 *   npx tsx scripts/import-woocommerce-csv.ts path/to/woo-export.csv
 *   npx tsx scripts/import-catalog.ts data/import/products.normalized.json
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { NormalizedProduct, dedupeProducts, parsePriceToCents, qualityCheck, slugify, stripHtml } from "./lib/normalize";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/import-woocommerce-csv.ts <woo-export.csv>");
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), "data", "import");
fs.mkdirSync(OUT_DIR, { recursive: true });

const raw = fs.readFileSync(file, "utf8");
const rows: Record<string, string>[] = parse(raw, { columns: true, skip_empty_lines: true, bom: true });

console.log(`Parsed ${rows.length} rows from ${file}`);

const products: NormalizedProduct[] = [];
for (const row of rows) {
  const type = (row["Type"] ?? "simple").toLowerCase();
  if (type.includes("variation")) continue; // parent rows carry catalogue data
  const published = row["Published"];
  if (published === "0" || published === "-1") continue;

  const name = row["Name"]?.trim();
  if (!name) continue;

  // Attributes: "Attribute 1 name"/"Attribute 1 value(s)" pairs
  const attributes: Record<string, string> = {};
  for (let i = 1; i <= 10; i++) {
    const attrName = row[`Attribute ${i} name`];
    const attrValue = row[`Attribute ${i} value(s)`];
    if (attrName && attrValue) attributes[attrName.trim()] = attrValue.trim();
  }

  const weightKg = parseFloat(row["Weight (kg)"] ?? "");
  const dims = {
    l: parseFloat(row["Length (cm)"] ?? "") * 10 || undefined,
    w: parseFloat(row["Width (cm)"] ?? "") * 10 || undefined,
    h: parseFloat(row["Height (cm)"] ?? "") * 10 || undefined,
  };

  const stockRaw = (row["In stock?"] ?? "").trim();
  const backorders = (row["Backorders allowed?"] ?? "").trim();
  const qty = parseInt(row["Stock"] ?? "", 10);

  products.push({
    sourceType: "WOO_IMPORT",
    sourceUrl: row["External URL"] || undefined,
    slug: slugify(row["Slug"] || name),
    name,
    sku: row["SKU"]?.trim() || undefined,
    regularPriceCents: parsePriceToCents(row["Regular price"]),
    salePriceCents: parsePriceToCents(row["Sale price"]),
    stockStatus:
      stockRaw === "1" || /instock/i.test(stockRaw)
        ? "IN_STOCK"
        : backorders === "1" || /backorder/i.test(stockRaw)
          ? "BACKORDER"
          : "OUT_OF_STOCK",
    stockQty: Number.isFinite(qty) ? qty : undefined,
    shortDescription: stripHtml(row["Short description"]),
    description: stripHtml(row["Description"]),
    categories: (row["Categories"] ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    brand: attributes["Brand"] ?? attributes["brand"] ?? (row["Brands"]?.split(",")[0]?.trim() || undefined),
    images: (row["Images"] ?? "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean)
      .map((url) => ({ url })),
    attributes: Object.keys(attributes).length ? attributes : undefined,
    weightGrams: Number.isFinite(weightKg) ? Math.round(weightKg * 1000) : undefined,
    dimensionsMm: dims.l || dims.w || dims.h ? dims : undefined,
    seoTitle: row["Meta: _yoast_wpseo_title"] || undefined,
    seoDescription: row["Meta: _yoast_wpseo_metadesc"] || undefined,
    crossSellSlugs: (row["Cross-sells"] ?? "").split(",").map((s) => slugify(s.trim())).filter(Boolean),
    upsellSlugs: (row["Upsells"] ?? "").split(",").map((s) => slugify(s.trim())).filter(Boolean),
  });
}

const { kept, duplicates } = dedupeProducts(products);
const issues = qualityCheck(kept);

const outFile = path.join(OUT_DIR, "products.normalized.json");
fs.writeFileSync(outFile, JSON.stringify(kept, null, 2));

const redirectRows = ["from,to", ...kept.map((p) => `/product/${p.slug}/,/products/${p.slug}`)];
fs.writeFileSync(path.join(OUT_DIR, "redirect-map.csv"), redirectRows.join("\n"));

fs.writeFileSync(
  path.join(OUT_DIR, "import-quality-report.md"),
  [
    `# WooCommerce CSV import quality report — ${new Date().toISOString()}`,
    "",
    `- Rows in export: ${rows.length}`,
    `- Products normalised: ${products.length}`,
    `- Kept after dedupe: ${kept.length} (${duplicates.length} duplicates dropped)`,
    `- Quality issues: ${issues.length}`,
    "",
    "## Duplicates",
    ...duplicates.map((d) => `- kept \`${d.kept}\`, dropped \`${d.dropped}\` (${d.reason})`),
    "",
    "## Issues",
    ...issues.map((i) => `- \`${i.slug}\`: ${i.issue}`),
  ].join("\n"),
);

console.log(`Wrote ${kept.length} products → ${outFile}`);
console.log(`Quality report → ${path.join(OUT_DIR, "import-quality-report.md")}`);
console.log(`Next: npx tsx scripts/import-catalog.ts ${outFile}`);
