/**
 * Migrate product photography off the old WooCommerce media library.
 *
 * Downloads every remote ProductImage URL in the database into
 * public/products/live/<original-filename>, then repoints the DB rows at the
 * local copies. Idempotent: already-downloaded files are skipped, so it can
 * be re-run after failures or future imports.
 *
 * NOTE: must run from a machine that can reach allamericanmuscle.co.za
 * (the rebuild sandbox cannot — its egress policy blocks the domain and
 * public image proxies alike). Drix's Mac or the production host both work:
 *
 *   DATABASE_URL="<direct connection>" npx tsx scripts/fetch-product-images.ts
 *
 * Options:
 *   --dry-run        list what would be downloaded, touch nothing
 *   --delay <ms>     wait between downloads (default 400ms — be kind to the host)
 *   --keep-remote    download files but do NOT repoint DB rows
 *
 * Outputs reports/image-migration-report.md with successes, failures and
 * total size. Commit public/products/live/ (or sync it to your CDN) after
 * running, then redeploy.
 */

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");
const KEEP_REMOTE = process.argv.includes("--keep-remote");
const delayIdx = process.argv.indexOf("--delay");
const DELAY_MS = delayIdx >= 0 ? parseInt(process.argv[delayIdx + 1], 10) || 400 : 400;

const OUT_DIR = path.join(process.cwd(), "public", "products", "live");
const REPORT = path.join(process.cwd(), "reports", "image-migration-report.md");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function localNameFor(url: string): string {
  // Preserve the WP filename; prefix the upload folder to avoid collisions
  // (e.g. 2026/06/2285.webp -> 2026-06-2285.webp).
  const u = new URL(url);
  const parts = u.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("uploads");
  const tail = idx >= 0 ? parts.slice(idx + 1) : parts.slice(-1);
  return tail.join("-").replace(/[^\w.-]/g, "_");
}

async function main() {
  const images = await prisma.productImage.findMany({
    where: { url: { startsWith: "http" } },
    include: { product: { select: { slug: true, sku: true } } },
    orderBy: { id: "asc" },
  });
  console.log(`${images.length} remote image references in the database`);
  if (images.length === 0) return;

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  let repointed = 0;
  let totalBytes = 0;
  const failures: { url: string; product: string; reason: string }[] = [];

  for (const [i, img] of images.entries()) {
    const fileName = localNameFor(img.url);
    const filePath = path.join(OUT_DIR, fileName);
    const localUrl = `/products/live/${fileName}`;

    if (DRY_RUN) {
      console.log(`[dry-run] ${img.url} -> ${localUrl}`);
      continue;
    }

    if (!fs.existsSync(filePath)) {
      try {
        const res = await fetch(img.url, {
          headers: { "User-Agent": "AAM-Rebuild-ImageMigration/1.0 (parts@allamericanmuscle.co.za)" },
          redirect: "follow",
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const type = res.headers.get("content-type") ?? "";
        if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 100) throw new Error("suspiciously small response");
        fs.writeFileSync(filePath, buf);
        totalBytes += buf.length;
        downloaded++;
        await sleep(DELAY_MS);
      } catch (err) {
        failures.push({
          url: img.url,
          product: `${img.product.slug} (${img.product.sku ?? "no SKU"})`,
          reason: err instanceof Error ? err.message : "unknown error",
        });
        continue;
      }
    } else {
      skipped++;
    }

    if (!KEEP_REMOTE) {
      await prisma.productImage.update({ where: { id: img.id }, data: { url: localUrl } });
      repointed++;
    }

    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${images.length} processed`);
  }

  if (!DRY_RUN) {
    fs.mkdirSync(path.dirname(REPORT), { recursive: true });
    fs.writeFileSync(
      REPORT,
      [
        `# Image migration report — ${new Date().toISOString()}`,
        "",
        `- Remote references found: ${images.length}`,
        `- Downloaded: ${downloaded} (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`,
        `- Already present (skipped): ${skipped}`,
        `- DB rows repointed to local files: ${repointed}`,
        `- Failures: ${failures.length}`,
        "",
        "## Failures",
        ...(failures.length ? failures.map((f) => `- ${f.product}: ${f.url} — ${f.reason}`) : ["(none)"]),
        "",
        "Next steps: commit public/products/live/ (or upload to your CDN and",
        "adjust the URLs), redeploy, and spot-check a few product pages.",
      ].join("\n"),
    );
    await prisma.auditLog.create({
      data: {
        actor: "system",
        action: "images.migrated",
        meta: { downloaded, skipped, repointed, failures: failures.length, totalBytes },
      },
    });
    console.log(`\nDone: ${downloaded} downloaded, ${skipped} already present, ${repointed} DB rows repointed, ${failures.length} failures.`);
    console.log(`Report: ${REPORT}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
