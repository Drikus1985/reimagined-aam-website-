/**
 * Converter for the AAM Store-API catalogue export
 * (aam_site_catalogue_YYYYMMDD.csv — produced from the live site's public
 * WooCommerce Store API; see reports/REBUILD_HANDOVER_20260811.md).
 *
 * Columns: ID, SKU, Name, Slug, Permalink, Type, Current/Regular/Sale price (R),
 * On sale, In stock, Low stock remaining, Categories, Category slugs,
 * Image URLs, Short description, Description (text)
 *
 * Does two things:
 *  1. Upserts the site's category set (with the documented duplicate merge:
 *     "Ignitions & Electrical" -> "Ignition & Electrical").
 *  2. Writes data/import/products.normalized.json for import-catalog.ts,
 *     using the SITE category slugs so old /product-category/<slug>/ URLs
 *     keep working via the pattern-redirect fallback.
 *
 * Usage:
 *   npx tsx scripts/import-aam-store-csv.ts <catalogue.csv>
 *   npx tsx scripts/import-catalog.ts data/import/products.normalized.json --replace-sample
 *   npx tsx scripts/finalize-live-catalog.ts
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { NormalizedProduct, dedupeProducts, parsePriceToCents, qualityCheck } from "./lib/normalize";

const prisma = new PrismaClient();

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/import-aam-store-csv.ts <aam_site_catalogue.csv>");
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), "data", "import");
fs.mkdirSync(OUT_DIR, { recursive: true });

/** Documented category merge (handover §1): duplicate pair on the live site. */
const CATEGORY_SLUG_MERGE: Record<string, string> = {
  "ignitions-electrical": "ignition-electrical",
};
const CATEGORY_NAME_OVERRIDE: Record<string, string> = {
  "ignition-electrical": "Ignition & Electrical",
};

async function main() {
  const rows: Record<string, string>[] = parse(fs.readFileSync(file, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
  console.log(`Parsed ${rows.length} rows`);

  // ---- 1. Collect + upsert the site's categories (slug -> name) ----
  const categories = new Map<string, string>();
  for (const row of rows) {
    const slugs = row["Category slugs"].split(",").map((s) => s.trim()).filter(Boolean);
    const names = row["Categories"].split(",").map((s) => s.trim()).filter(Boolean);
    slugs.forEach((slug, i) => {
      const canonical = CATEGORY_SLUG_MERGE[slug] ?? slug;
      const name = CATEGORY_NAME_OVERRIDE[canonical] ?? names[i] ?? canonical;
      if (!categories.has(canonical)) categories.set(canonical, name);
    });
  }
  for (const [slug, name] of categories) {
    await prisma.category.upsert({ where: { slug }, create: { slug, name }, update: { name } });
  }
  // Merged category slugs need explicit redirects (the pattern fallback only
  // matches categories that still exist).
  for (const [oldSlug, newSlug] of Object.entries(CATEGORY_SLUG_MERGE)) {
    await prisma.redirect.upsert({
      where: { fromPath: `/product-category/${oldSlug}/` },
      create: { fromPath: `/product-category/${oldSlug}/`, toPath: `/category/${newSlug}` },
      update: { toPath: `/category/${newSlug}` },
    });
  }
  console.log(`Upserted ${categories.size} site categories (merged: ${Object.keys(CATEGORY_SLUG_MERGE).join(", ")})`);

  // ---- 2. Normalise products ----
  const products: NormalizedProduct[] = rows
    .filter((row) => row["Name"]?.trim() && row["Slug"]?.trim())
    .map((row) => {
      const onSale = row["On sale"] === "yes";
      const regular = parsePriceToCents(row["Regular price (R)"]);
      const sale = onSale ? parsePriceToCents(row["Sale price (R)"]) : undefined;
      const lowStock = parseInt(row["Low stock remaining"], 10);
      const catSlugs = [
        ...new Set(
          row["Category slugs"]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => CATEGORY_SLUG_MERGE[s] ?? s),
        ),
      ];
      return {
        sourceType: "WOO_IMPORT" as const,
        sourceUrl: row["Permalink"] || undefined,
        slug: row["Slug"].trim().toLowerCase(),
        name: row["Name"].trim(),
        sku: row["SKU"].trim() || undefined,
        regularPriceCents: regular,
        salePriceCents: sale,
        // The Store API exposes in-stock yes/no only; "no" may include
        // backorderable items — staff can flip those to BACKORDER in admin.
        stockStatus: row["In stock"] === "yes" ? ("IN_STOCK" as const) : ("OUT_OF_STOCK" as const),
        stockQty: Number.isFinite(lowStock) && lowStock > 0 ? lowStock : undefined,
        shortDescription: row["Short description"]?.trim() || undefined,
        description: row["Description (text)"]?.trim() || undefined,
        // Site slugs are passed straight through; import-catalog resolves them
        // against the categories upserted above (slugify() is a no-op on slugs).
        categories: catSlugs,
        brand: undefined, // not exposed by the Store API export; see finalize step
        images: (row["Image URLs"] ?? "")
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean)
          .map((url) => ({ url })),
        seoTitle: undefined,
        seoDescription: row["Short description"]?.trim().slice(0, 160) || undefined,
        canonicalUrl: undefined,
      };
    });

  const { kept, duplicates } = dedupeProducts(products);
  const issues = qualityCheck(kept);

  const outFile = path.join(OUT_DIR, "products.normalized.json");
  fs.writeFileSync(outFile, JSON.stringify(kept, null, 2));

  const redirectRows = ["from,to"];
  for (const p of kept) {
    if (p.sourceUrl) redirectRows.push(`${new URL(p.sourceUrl).pathname},/products/${p.slug}`);
  }
  fs.writeFileSync(path.join(OUT_DIR, "redirect-map.csv"), redirectRows.join("\n"));

  fs.writeFileSync(
    path.join(OUT_DIR, "import-quality-report.md"),
    [
      `# AAM Store-API catalogue import — ${new Date().toISOString()}`,
      "",
      `- Source file: ${path.basename(file)}`,
      `- Rows: ${rows.length}; normalised: ${products.length}; kept after dedupe: ${kept.length} (${duplicates.length} duplicates)`,
      `- In stock: ${kept.filter((p) => p.stockStatus === "IN_STOCK").length}`,
      `- Without images: ${kept.filter((p) => p.images.length === 0).length} (flagged needsReview)`,
      `- Categories: ${categories.size} (site slugs, "Ignitions & Electrical" merged into "Ignition & Electrical")`,
      "",
      "## PRICING NOTE (handover §1)",
      "Site prices are known to be superseded by the approved master repricing of",
      "09–10.08.2026 for 653 SKUs. Apply the master via:",
      "  npx tsx scripts/apply-price-overrides.ts data/price-overrides.csv",
      "once site_vs_master_price_deltas.csv / the master export is supplied.",
      "The four explicitly corrected SKUs are committed in data/price-overrides.csv.",
      "",
      "## Duplicates",
      ...duplicates.map((d) => `- kept \`${d.kept}\`, dropped \`${d.dropped}\` (${d.reason})`),
      "",
      "## Quality issues",
      ...issues.map((i) => `- \`${i.slug}\`: ${i.issue}`),
    ].join("\n"),
  );

  console.log(`Wrote ${kept.length} products → ${outFile}`);
  console.log("Next: npx tsx scripts/import-catalog.ts data/import/products.normalized.json --replace-sample");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
