/**
 * Attach reviewed product photos to catalogue products by SKU.
 *
 * Companion to extract-supplier-images.mjs: after extracting supplier photos
 * and visually approving the ones in <out>/matched/, run this to copy them
 * into public/products/live/ and create the ProductImage rows for products
 * that have no photo yet.
 *
 *   npx tsx scripts/attach-product-images.ts supplier-images/matched
 *
 * File names must be <SKU>.<ext> (the extractor writes them that way;
 * "/" and other odd SKU characters appear as "_"). Idempotent: a product
 * whose image URL already exists is skipped.
 *
 * Options:
 *   --dry-run       report what would be attached, write nothing
 *   --replace       also attach to products that already have images (appended last)
 *   --set-primary   for products that already have images, overwrite the FIRST
 *                   image's URL with the new local file (photo upgrade mode)
 */

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");
const REPLACE = process.argv.includes("--replace");
const SET_PRIMARY = process.argv.includes("--set-primary");
const dir = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!dir || !fs.existsSync(dir)) {
  console.error("Usage: npx tsx scripts/attach-product-images.ts <dir-of-SKU-named-images> [--dry-run] [--replace]");
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), "public", "products", "live");
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);
// Must mirror sanitize() in extract-supplier-images.mjs so SKUs round-trip.
const sanitize = (s: string) => s.trim().replace(/[^\w.()+-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);

async function main() {
  const products = await prisma.product.findMany({
    where: { sku: { not: null } },
    select: { id: true, sku: true, slug: true, _count: { select: { images: true } } },
  });
  const bySanitizedSku = new Map<string, (typeof products)[number]>();
  for (const p of products) if (p.sku) bySanitizedSku.set(sanitize(p.sku).toUpperCase(), p);

  const files = fs.readdirSync(dir).filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
  console.log(`${files.length} image files in ${dir}, ${products.length} products with SKUs in the database`);

  let attached = 0;
  const unmatched: string[] = [];
  const skippedExisting: string[] = [];

  for (const file of files.sort()) {
    const ext = path.extname(file).toLowerCase();
    // strip the extractor's collision suffix ("-2", "-3") if present
    const base = path.basename(file, ext);
    const product =
      bySanitizedSku.get(base.toUpperCase()) ?? bySanitizedSku.get(base.replace(/-\d+$/, "").toUpperCase());
    if (!product) {
      unmatched.push(file);
      continue;
    }
    if (product._count.images > 0 && !REPLACE && !SET_PRIMARY) {
      skippedExisting.push(`${file} (${product.sku} already has ${product._count.images} image(s))`);
      continue;
    }

    const outName = `supplier-${sanitize(product.sku!)}${ext}`.toLowerCase();
    const url = `/products/live/${outName}`;
    if (DRY_RUN) {
      console.log(`[dry-run] ${file} -> ${url} (${product.sku}, ${product.slug})${SET_PRIMARY && product._count.images > 0 ? " [replaces primary]" : ""}`);
      attached++;
      continue;
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.copyFileSync(path.join(dir, file), path.join(OUT_DIR, outName));
    if (SET_PRIMARY && product._count.images > 0) {
      const primary = await prisma.productImage.findFirst({
        where: { productId: product.id },
        orderBy: { position: "asc" },
      });
      await prisma.productImage.update({ where: { id: primary!.id }, data: { url } });
    } else {
      const existing = await prisma.productImage.findFirst({ where: { productId: product.id, url } });
      if (!existing) {
        await prisma.productImage.create({
          data: { productId: product.id, url, alt: product.sku ?? product.slug, position: product._count.images },
        });
      }
    }
    attached++;
  }

  if (!DRY_RUN && attached > 0) {
    await prisma.auditLog.create({
      data: {
        actor: "system",
        action: "images.supplier-attached",
        meta: { dir, attached, unmatched: unmatched.length, skippedExisting: skippedExisting.length },
      },
    });
  }

  console.log(`\n${DRY_RUN ? "[dry-run] would attach" : "Attached"}: ${attached}`);
  if (skippedExisting.length) console.log(`Skipped (already has images, no --replace):\n  ${skippedExisting.join("\n  ")}`);
  if (unmatched.length) console.log(`No SKU match in database:\n  ${unmatched.join("\n  ")}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
