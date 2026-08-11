/**
 * Apply approved pricing overrides by SKU.
 *
 * Accepts either:
 *  - a simple CSV with headers  SKU,Price          (price in rand, VAT-incl), or
 *  - the handover's site_vs_master_price_deltas.csv
 *    (headers: Site SKU, Master code, Name, Site price (incl), Master retail (incl), Delta)
 *    in which case "Master retail (incl)" is applied to "Site SKU".
 *
 * The approved master supersedes site pricing (handover §1). A sale price
 * that is no longer below the new regular price is cleared.
 *
 * Usage: npx tsx scripts/apply-price-overrides.ts <file.csv>
 */

import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { parsePriceToCents } from "./lib/normalize";

const prisma = new PrismaClient();

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/apply-price-overrides.ts <overrides.csv>");
  process.exit(1);
}

async function main() {
  const rows: Record<string, string>[] = parse(fs.readFileSync(file, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  let applied = 0;
  const missing: string[] = [];

  for (const row of rows) {
    const sku = (row["SKU"] ?? row["Site SKU"] ?? "").trim();
    const priceCents = parsePriceToCents(row["Price"] ?? row["Master retail (incl)"]);
    if (!sku || priceCents == null) continue;

    const product = await prisma.product.findFirst({ where: { sku } });
    if (!product) {
      missing.push(sku);
      continue;
    }
    const clearSale = product.salePriceCents != null && product.salePriceCents >= priceCents;
    await prisma.product.update({
      where: { id: product.id },
      data: { regularPriceCents: priceCents, ...(clearSale ? { salePriceCents: null } : {}) },
    });
    applied++;
  }

  await prisma.auditLog.create({
    data: { actor: "system", action: "pricing.overrides_applied", meta: { file, applied, missing: missing.length } },
  });

  console.log(`Applied ${applied} price overrides.`);
  if (missing.length) {
    console.log(`${missing.length} SKUs not found in catalogue (master-only / unpublished):`);
    console.log(missing.join(", "));
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
