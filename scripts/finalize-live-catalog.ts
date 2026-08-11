/**
 * Post-import finishing pass for the live catalogue:
 *  1. Brand inference from product-name prefixes (the Store API export has no
 *     brand column; the name literally carries it, e.g. "Mastodon …").
 *  2. Flag site SKUs with no approved-master match as needsReview
 *     (handover: reconcile before launch).
 *  3. Remove now-empty leftover seed categories (keeps nav/facets clean).
 *  4. Merchandising defaults: mark a spread of in-stock, photographed products
 *     as featured/best-sellers so the homepage has content — staff curate in
 *     admin afterwards.
 *
 * Usage: npx tsx scripts/finalize-live-catalog.ts [site_skus_not_in_master.csv]
 */

import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { slugify } from "./lib/normalize";

const prisma = new PrismaClient();

/** Name-prefix → brand. Order matters (longest match first). */
const BRAND_PREFIXES: [string, string][] = [
  ["Ford Racing", "Ford Racing"],
  ["AP Racing", "AP Racing"],
  ["COMP Cams", "COMP Cams"],
  ["COMP ", "COMP Cams"],
  ["Mastodon", "Mastodon"],
  ["Enginetech", "Enginetech"],
  ["EngineTech", "Enginetech"],
  ["Edelbrock", "Edelbrock"],
  ["ARP ", "ARP"],
  ["Lokar", "Lokar"],
  ["Speedmaster", "Speedmaster"],
  ["Fel-Pro", "Fel-Pro"],
  ["Holley", "Holley"],
  ["MSD ", "MSD"],
  ["Moog", "Moog"],
  ["Dynacorn", "Dynacorn"],
  ["Prosport", "Prosport"],
  ["GUD", "GUD"],
  ["Depo", "Depo"],
  ["Anchor", "Anchor"],
];

async function main() {
  // ---- 0. Hard-delete archived sample seed products ----
  // --replace-sample archives them; with the real catalogue in place they can
  // go entirely so category counts and joins reflect live data only.
  // (OrderItem.productId is SetNull on delete — order snapshots survive.)
  const deleted = await prisma.product.deleteMany({
    where: { sourceType: "SAMPLE", status: "ARCHIVED" },
  });
  console.log(`Deleted ${deleted.count} archived sample products`);

  // ---- 1. Brand inference ----
  const brandIds = new Map<string, string>();
  async function brandId(name: string): Promise<string> {
    if (brandIds.has(name)) return brandIds.get(name)!;
    const slug = slugify(name);
    const row = await prisma.brand.upsert({ where: { slug }, create: { slug, name }, update: {} });
    brandIds.set(name, row.id);
    return row.id;
  }

  const unbranded = await prisma.product.findMany({ where: { brandId: null, status: "ACTIVE" } });
  let branded = 0;
  for (const p of unbranded) {
    const match = BRAND_PREFIXES.find(([prefix]) => p.name.toLowerCase().startsWith(prefix.toLowerCase()));
    if (!match) continue;
    await prisma.product.update({ where: { id: p.id }, data: { brandId: await brandId(match[1]) } });
    branded++;
  }
  console.log(`Brand inferred for ${branded}/${unbranded.length} unbranded products`);

  // ---- 2. Flag SKUs with no master match ----
  const notInMasterFile = process.argv[2];
  if (notInMasterFile && fs.existsSync(notInMasterFile)) {
    const rows: Record<string, string>[] = parse(fs.readFileSync(notInMasterFile, "utf8"), {
      columns: true, skip_empty_lines: true, bom: true,
    });
    let flagged = 0;
    for (const row of rows) {
      const sku = (row["Site SKU"] ?? row["SKU"] ?? "").trim();
      if (!sku) continue;
      const res = await prisma.product.updateMany({ where: { sku }, data: { needsReview: true } });
      flagged += res.count;
    }
    console.log(`Flagged ${flagged} products with no approved-master match (needsReview)`);
  }

  // ---- 3. Remove empty leftover categories (no products, no children with products) ----
  let removed = 0;
  for (let pass = 0; pass < 3; pass++) {
    const empties = await prisma.category.findMany({
      where: { products: { none: {} }, children: { none: {} } },
    });
    // Only remove categories whose products are ALL archived/gone — the query
    // above counts join rows, which archived products still hold, so this only
    // catches genuinely empty ones (seed subcategories etc.).
    for (const cat of empties) {
      await prisma.category.delete({ where: { id: cat.id } });
      removed++;
    }
    if (empties.length === 0) break;
  }
  console.log(`Removed ${removed} empty categories`);

  // ---- 4. Merchandising defaults ----
  await prisma.product.updateMany({ data: { isFeatured: false, isBestSeller: false, popularity: 0 } });

  // Featured: the highest-priced in-stock photographed product from each of 8 major categories.
  const majorCats = await prisma.category.findMany({
    where: { parentId: null, products: { some: { product: { status: "ACTIVE", stockStatus: "IN_STOCK" } } } },
    orderBy: { position: "asc" },
    take: 12,
  });
  let featured = 0;
  for (const cat of majorCats) {
    if (featured >= 8) break;
    const hero = await prisma.product.findFirst({
      where: {
        status: "ACTIVE",
        stockStatus: "IN_STOCK",
        images: { some: {} },
        categories: { some: { categoryId: cat.id } },
        isFeatured: false,
      },
      orderBy: { regularPriceCents: "desc" },
    });
    if (hero) {
      await prisma.product.update({ where: { id: hero.id }, data: { isFeatured: true, popularity: 90 - featured } });
      featured++;
    }
  }

  // Best sellers: in-stock, photographed items with low remaining stock (a
  // weak demand proxy from the export) — purely a starting point for staff.
  const movers = await prisma.product.findMany({
    where: {
      status: "ACTIVE", stockStatus: "IN_STOCK", images: { some: {} },
      stockQty: { gte: 1, lte: 3 }, isFeatured: false,
    },
    orderBy: { regularPriceCents: "desc" },
    take: 8,
  });
  for (const [i, p] of movers.entries()) {
    await prisma.product.update({ where: { id: p.id }, data: { isBestSeller: true, popularity: 70 - i } });
  }
  console.log(`Curated ${featured} featured + ${movers.length} best-seller defaults (staff can change in admin)`);

  await prisma.auditLog.create({
    data: { actor: "system", action: "catalog.finalized", meta: { branded, removedCategories: removed, featured, bestSellers: movers.length } },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
