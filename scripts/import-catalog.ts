/**
 * Load normalized catalogue JSON (from the crawler or the WooCommerce CSV
 * importer) into the database. Idempotent: products are upserted by slug,
 * with SKU as a secondary match. Existing SAMPLE seed products with matching
 * slugs/SKUs are replaced by real imported data.
 *
 * Usage:
 *   npx tsx scripts/import-catalog.ts data/import/products.normalized.json [--replace-sample]
 *
 * --replace-sample : after import, archive any remaining SAMPLE products so
 *                    only migrated data is live.
 */

import fs from "node:fs";
import { PrismaClient, SourceType, StockStatus } from "@prisma/client";
import { NormalizedProduct, detectEngineFamilies, slugify } from "./lib/normalize";

const prisma = new PrismaClient();

const file = process.argv[2];
const replaceSample = process.argv.includes("--replace-sample");
if (!file) {
  console.error("Usage: npx tsx scripts/import-catalog.ts <products.normalized.json> [--replace-sample]");
  process.exit(1);
}

async function ensureCategory(name: string): Promise<string> {
  // Supports "Parent > Child" hierarchy from Woo exports.
  const parts = name.split(">").map((p) => p.trim()).filter(Boolean);
  let parentId: string | null = null;
  let id = "";
  for (const part of parts) {
    const slug = slugify(part);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      id = existing.id;
      parentId = existing.id;
      continue;
    }
    const created: { id: string } = await prisma.category.create({ data: { slug, name: part, parentId } });
    id = created.id;
    parentId = created.id;
  }
  return id;
}

async function ensureBrand(name: string): Promise<string> {
  const slug = slugify(name);
  const existing = await prisma.brand.findUnique({ where: { slug } });
  if (existing) return existing.id;
  const created = await prisma.brand.create({ data: { slug, name } });
  return created.id;
}

async function main() {
  const products: NormalizedProduct[] = JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(`Importing ${products.length} products from ${file}…`);

  const engineFamilies = await prisma.engineFamily.findMany();
  const engineBySlug = new Map(engineFamilies.map((e) => [e.slug, e.id]));

  let created = 0;
  let updated = 0;

  for (const p of products) {
    const brandId = p.brand ? await ensureBrand(p.brand) : null;
    const categoryIds: string[] = [];
    for (const c of p.categories) categoryIds.push(await ensureCategory(c));

    const engineSlugs = detectEngineFamilies(`${p.name} ${p.description ?? ""} ${p.shortDescription ?? ""}`);

    const existing =
      (await prisma.product.findUnique({ where: { slug: p.slug } })) ??
      (p.sku ? await prisma.product.findFirst({ where: { sku: p.sku } }) : null);

    const data = {
      name: p.name,
      sku: p.sku ?? null,
      brandId,
      regularPriceCents: p.regularPriceCents ?? existing?.regularPriceCents ?? 0,
      salePriceCents: p.salePriceCents ?? null,
      stockStatus: (p.stockStatus ?? "IN_STOCK") as StockStatus,
      stockQty: p.stockQty ?? null,
      shortDescription: p.shortDescription ?? null,
      description: p.description ?? null,
      attributes: p.attributes ?? undefined,
      weightGrams: p.weightGrams ?? null,
      dimensionsMm: p.dimensionsMm ?? undefined,
      seoTitle: p.seoTitle ?? null,
      seoDescription: p.seoDescription ?? null,
      canonicalUrl: p.canonicalUrl ?? null,
      sourceUrl: p.sourceUrl ?? null,
      sourceType: p.sourceType as SourceType,
      // Imported rows need staff review only when data is incomplete.
      needsReview: p.regularPriceCents == null || p.images.length === 0,
    };

    const row = existing
      ? await prisma.product.update({ where: { id: existing.id }, data })
      : await prisma.product.create({ data: { ...data, slug: p.slug } });
    existing ? updated++ : created++;

    // Replace images & joins wholesale (idempotent re-import).
    await prisma.productImage.deleteMany({ where: { productId: row.id } });
    if (p.images.length > 0) {
      await prisma.productImage.createMany({
        data: p.images.slice(0, 10).map((img, i) => ({
          productId: row.id,
          url: img.url,
          alt: img.alt ?? p.name,
          position: i,
        })),
      });
    }
    await prisma.productCategory.deleteMany({ where: { productId: row.id } });
    for (const categoryId of new Set(categoryIds)) {
      await prisma.productCategory.create({ data: { productId: row.id, categoryId } });
    }
    await prisma.productEngine.deleteMany({ where: { productId: row.id } });
    for (const slug of engineSlugs) {
      const engineFamilyId = engineBySlug.get(slug);
      if (engineFamilyId) await prisma.productEngine.create({ data: { productId: row.id, engineFamilyId } });
    }

    // Redirect entry for the old Woo URL
    const fromPath = p.sourceUrl ? new URL(p.sourceUrl).pathname : `/product/${p.slug}/`;
    await prisma.redirect.upsert({
      where: { fromPath },
      create: { fromPath, toPath: `/products/${row.slug}` },
      update: { toPath: `/products/${row.slug}` },
    });
  }

  // Relations pass (targets must exist first)
  for (const p of products) {
    const row = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!row) continue;
    const link = async (slugs: string[] | undefined, type: "RELATED" | "CROSS_SELL" | "UPSELL") => {
      for (const slug of slugs ?? []) {
        const target = await prisma.product.findUnique({ where: { slug } });
        if (!target || target.id === row.id) continue;
        await prisma.productRelation.upsert({
          where: { productId_relatedId_type: { productId: row.id, relatedId: target.id, type } },
          create: { productId: row.id, relatedId: target.id, type },
          update: {},
        });
      }
    };
    await link(p.relatedSlugs, "RELATED");
    await link(p.crossSellSlugs, "CROSS_SELL");
    await link(p.upsellSlugs, "UPSELL");
  }

  if (replaceSample) {
    const archived = await prisma.product.updateMany({
      where: { sourceType: "SAMPLE" },
      data: { status: "ARCHIVED" },
    });
    console.log(`Archived ${archived.count} remaining SAMPLE seed products.`);
  }

  await prisma.auditLog.create({
    data: { actor: "system", action: "catalog.imported", meta: { file, created, updated } },
  });

  console.log(`Done: ${created} created, ${updated} updated.`);
  console.log("Remember to restart the app (or wait 60s) for the search index to rebuild.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
