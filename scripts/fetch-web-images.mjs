#!/usr/bin/env node
/**
 * Fetch the CONFIRMED web-sourced product photos (Drix sign-off 11.08.2026,
 * see reports/web-image-candidates.csv), enhance them to the house standard
 * (white background, square canvas, max 800px, webp) and write them
 * SKU-named into data/supplier-images/ ready for attach-product-images.ts.
 *
 * NOTE: must run from a machine with open internet (the rebuild sandbox's
 * egress gateway blocks these hosts). From the repo root on the Mac:
 *
 *   node scripts/fetch-web-images.mjs             # fetch + enhance
 *   DATABASE_URL="<direct>" npx tsx scripts/attach-product-images.ts data/supplier-images
 *
 * Then commit data/supplier-images/ + public/products/live/ and redeploy.
 * Failures are listed at the end — re-run any time; existing files are
 * refetched only with --force.
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

// SKU -> [primary URL, ...fallbacks]. Confirmed set, 11.08.2026.
const CONFIRMED = {
  "L817": ["https://enginetechcatalog.com/partimages/L817.jpg"],
  "L900": ["https://enginetechcatalog.com/partimages/L900.jpg"],
  // NB: BC200J is Enginetech's MAIN bearing set for 289/302 (rod = BB214J).
  // SKU kept authoritative; check the product name on the site.
  "BC200J25": ["https://enginetechcatalog.com/partimages/BC200J.jpg"],
  "BRG-114925": [
    "https://www.borgeson.com/images/product/D/114925.jpg",
    "https://static.summitracing.com/global/images/prod/xlarge/brg-114925_xl.jpg",
  ],
  "BRG-014949": [
    "https://www.borgeson.com/images/product/D/014949.jpg",
    "https://static.summitracing.com/global/images/prod/xlarge/brg-014949_xl.jpg",
  ],
  "AND SHIFT-2": [
    "https://cdn11.bigcommerce.com/s-jf84aish/images/stencil/1280x1280/products/7202/41915/81683__21669.1648484824.jpg",
  ],
  "KD2020": ["https://www.knfilters.com/media/images/press/RC-5052AL-2L.jpg"],
  "KD6078": ["https://sc04.alicdn.com/kf/H686983b036634b6abcc8d2f0cd96c72el.jpg"],
  "FT1502/10": [
    "https://content.speedwaymotors.com/ProductImages/91051510_L1600_d401ffb3-f6b0-44b5-8cd9-cf5ccf4747da.jpg",
  ],
  "NO.94": [
    "https://prosportgauges.com/cdn/shop/products/fuellevel_1024x1024_2x_45b95598-fa82-4d9a-b474-5081d7fe77b1.jpg",
  ],
  "WA6037B(C)": ["https://machv.com/cdn/shop/products/60mm_water_temp_1024x1024.jpg"],
  "M192704455679": ["https://m.media-amazon.com/images/I/417OjNJPvAL.jpg"],
};

const FORCE = process.argv.includes("--force");
const OUT = path.join(process.cwd(), "data", "supplier-images");
fs.mkdirSync(OUT, { recursive: true });
// must mirror attach-product-images.ts so the SKU round-trips
const sanitize = (s) => s.trim().replace(/[^\w.()+-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);

const failures = [];
let done = 0;

for (const [sku, urls] of Object.entries(CONFIRMED)) {
  const outFile = path.join(OUT, sanitize(sku) + ".webp");
  if (fs.existsSync(outFile) && !FORCE) {
    console.log(`skip (exists): ${sku}`);
    continue;
  }
  let buf = null, used = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AAM-Rebuild-ImageFetch/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
      const b = Buffer.from(await res.arrayBuffer());
      if (b.length < 1000) throw new Error("suspiciously small response");
      buf = b; used = url;
      break;
    } catch (err) {
      console.warn(`  ${sku}: ${url} -> ${err.message}`);
    }
  }
  if (!buf) { failures.push(sku); continue; }

  const meta = await sharp(buf).metadata();
  const scale = Math.min(4, 800 / Math.max(meta.width, meta.height));
  const w = Math.round(meta.width * scale), h = Math.round(meta.height * scale);
  const canvas = Math.min(800, Math.max(400, Math.round(Math.max(w, h) * 1.1)));
  let img = sharp(buf).resize(w, h, { kernel: "lanczos3" });
  if (scale > 1.2) img = img.sharpen({ sigma: 1.1, m1: 0.6, m2: 0.9 }); // only sharpen real upscales
  await img
    .flatten({ background: "#ffffff" })
    .extend({
      top: Math.floor((canvas - h) / 2), bottom: Math.ceil((canvas - h) / 2),
      left: Math.floor((canvas - w) / 2), right: Math.ceil((canvas - w) / 2),
      background: "#ffffff",
    })
    .webp({ quality: 88, effort: 5 })
    .toFile(outFile);
  done++;
  console.log(`${sku}: ${meta.width}x${meta.height} (${new URL(used).hostname}) -> ${path.basename(outFile)} ${canvas}x${canvas}`);
  await new Promise((r) => setTimeout(r, 500)); // be polite to the hosts
}

console.log(`\n${done} fetched+enhanced into ${OUT}`);
if (failures.length) console.log(`Failed (retry later or find an alternative URL): ${failures.join(", ")}`);
console.log("Next: npx tsx scripts/attach-product-images.ts data/supplier-images");
