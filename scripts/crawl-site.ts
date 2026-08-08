/**
 * Repeatable, polite crawler for the public All American Muscle WooCommerce
 * site. Respects robots.txt, rate-limits requests, and only touches public
 * catalogue/content pages.
 *
 * Usage:
 *   npx tsx scripts/crawl-site.ts [--base https://allamericanmuscle.co.za] [--delay 1500] [--limit 0]
 *
 * Outputs (data/crawl/):
 *   products.normalized.json   — NormalizedProduct[] (feed to import-catalog.ts)
 *   pages.json                 — non-product public content (about, policies, articles)
 *   source-manifest.json       — every URL fetched, with status + timestamp
 *   asset-manifest.json        — every image URL discovered (download separately)
 *   crawl-report.md            — summary + errors
 *   redirect-map.csv           — old URL -> proposed new route
 *
 * NOTE: In the build environment used to develop this project, outbound
 * traffic to allamericanmuscle.co.za was blocked by the network egress
 * policy (documented in reports/crawl-report.md). Run this script from a
 * machine with normal internet access, or use the WooCommerce CSV importer
 * with an export provided by the store owner.
 */

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import {
  NormalizedProduct, dedupeProducts, parsePriceToCents, qualityCheck, slugify, stripHtml,
} from "./lib/normalize";

const args = process.argv.slice(2);
const arg = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = arg("base", "https://allamericanmuscle.co.za").replace(/\/$/, "");
const DELAY_MS = parseInt(arg("delay", "1500"), 10); // ≥1.5s between requests: polite
const LIMIT = parseInt(arg("limit", "0"), 10); // 0 = no limit
const OUT_DIR = path.join(process.cwd(), "data", "crawl");
const USER_AGENT = "AAM-Rebuild-Crawler/1.0 (site migration for the store owner; contact parts@allamericanmuscle.co.za)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ManifestEntry = { url: string; status: number | string; fetchedAt: string; type: string };
const manifest: ManifestEntry[] = [];
const assets = new Set<string>();
const errors: string[] = [];

let disallowRules: string[] = [];

async function fetchText(url: string, type: string): Promise<string | null> {
  const pathPart = new URL(url).pathname;
  if (disallowRules.some((rule) => rule && pathPart.startsWith(rule))) {
    manifest.push({ url, status: "skipped (robots.txt)", fetchedAt: new Date().toISOString(), type });
    return null;
  }
  try {
    await sleep(DELAY_MS);
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
    manifest.push({ url, status: res.status, fetchedAt: new Date().toISOString(), type });
    if (!res.ok) {
      errors.push(`${res.status} ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    manifest.push({ url, status: `error: ${err instanceof Error ? err.message : "unknown"}`, fetchedAt: new Date().toISOString(), type });
    errors.push(`FETCH FAILED ${url}: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

async function loadRobots(): Promise<void> {
  try {
    const res = await fetch(`${BASE}/robots.txt`, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return;
    const text = await res.text();
    let applies = false;
    for (const line of text.split("\n")) {
      const [rawKey, ...rest] = line.split(":");
      const key = rawKey?.trim().toLowerCase();
      const value = rest.join(":").trim();
      if (key === "user-agent") applies = value === "*" || USER_AGENT.toLowerCase().includes(value.toLowerCase());
      else if (applies && key === "disallow" && value) disallowRules.push(value);
    }
    console.log(`robots.txt loaded: ${disallowRules.length} disallow rules honoured`);
  } catch {
    console.warn("Could not load robots.txt — proceeding with conservative defaults");
    disallowRules = ["/wp-admin", "/my-account", "/cart", "/checkout"];
  }
}

async function discoverUrls(): Promise<{ productUrls: string[]; pageUrls: string[] }> {
  const productUrls = new Set<string>();
  const pageUrls = new Set<string>();

  // 1) Sitemap-first discovery
  const sitemapCandidates = [`${BASE}/sitemap_index.xml`, `${BASE}/sitemap.xml`, `${BASE}/wp-sitemap.xml`];
  for (const sm of sitemapCandidates) {
    const xml = await fetchText(sm, "sitemap");
    if (!xml) continue;
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    for (const loc of locs) {
      if (/sitemap.*\.xml/i.test(loc) && loc !== sm) {
        const child = await fetchText(loc, "sitemap");
        if (child) {
          for (const m of child.matchAll(/<loc>([^<]+)<\/loc>/g)) {
            const url = m[1].trim();
            if (url.includes("/product/")) productUrls.add(url);
            else if (!/\.(jpg|jpeg|png|webp|gif|pdf)$/i.test(url)) pageUrls.add(url);
          }
        }
      } else if (loc.includes("/product/")) productUrls.add(loc);
      else if (!/\.(jpg|jpeg|png|webp|gif|pdf)$/i.test(loc)) pageUrls.add(loc);
    }
    if (productUrls.size > 0) break;
  }

  // 2) Fallback: paginate the shop archive
  if (productUrls.size === 0) {
    for (let page = 1; page <= 100; page++) {
      const html = await fetchText(`${BASE}/shop/page/${page}/`, "shop-archive");
      if (!html) break;
      const $ = cheerio.load(html);
      const links = $("a[href*='/product/']").map((_, el) => $(el).attr("href")).get();
      if (links.length === 0) break;
      links.forEach((l) => l && productUrls.add(new URL(l, BASE).toString()));
    }
  }

  return { productUrls: [...productUrls], pageUrls: [...pageUrls] };
}

function extractProduct(html: string, url: string): NormalizedProduct | null {
  const $ = cheerio.load(html);

  // Prefer WooCommerce's JSON-LD Product markup.
  let ld: Record<string, unknown> | null = null;
  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      const graph = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
      for (const node of graph) {
        if (node["@type"] === "Product" || (Array.isArray(node["@type"]) && node["@type"].includes("Product"))) {
          ld = node;
        }
      }
    } catch { /* invalid JSON-LD — fall back to DOM */ }
  });

  const ldObj = (ld ?? {}) as Record<string, any>;
  const name: string | undefined = ldObj.name ?? $("h1.product_title").first().text().trim() ?? $("h1").first().text().trim();
  if (!name) return null;

  const offers = Array.isArray(ldObj.offers) ? ldObj.offers[0] : ldObj.offers;
  const regularPriceCents =
    parsePriceToCents($("p.price del .amount").first().text()) ??
    parsePriceToCents(offers?.highPrice ?? offers?.price) ??
    parsePriceToCents($("p.price .amount").first().text());
  const salePriceCents = $("p.price ins .amount").length
    ? parsePriceToCents($("p.price ins .amount").first().text())
    : undefined;

  const availability: string = offers?.availability ?? "";
  const domStock = $(".stock").first().text().toLowerCase();
  const stockStatus =
    availability.includes("InStock") || domStock.includes("in stock")
      ? "IN_STOCK"
      : availability.includes("BackOrder") || domStock.includes("backorder")
        ? "BACKORDER"
        : availability.includes("OutOfStock") || domStock.includes("out of stock")
          ? "OUT_OF_STOCK"
          : undefined;
  const qtyMatch = domStock.match(/(\d+)\s+in stock/);

  const categories = $(".posted_in a, nav.woocommerce-breadcrumb a")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((c) => c && !/home|shop/i.test(c));

  const images: { url: string; alt?: string }[] = [];
  $(".woocommerce-product-gallery img, figure img").each((_, el) => {
    const src = $(el).attr("data-large_image") ?? $(el).attr("src");
    if (src && !src.startsWith("data:")) {
      const abs = new URL(src, BASE).toString();
      if (!images.some((i) => i.url === abs)) {
        images.push({ url: abs, alt: $(el).attr("alt") || undefined });
        assets.add(abs);
      }
    }
  });
  if (ldObj.image) {
    const ldImages: string[] = Array.isArray(ldObj.image) ? ldObj.image : [ldObj.image];
    for (const img of ldImages) {
      const abs = new URL(String(img), BASE).toString();
      if (!images.some((i) => i.url === abs)) {
        images.push({ url: abs });
        assets.add(abs);
      }
    }
  }

  const attributes: Record<string, string> = {};
  $("table.woocommerce-product-attributes tr").each((_, el) => {
    const label = $(el).find("th").text().trim();
    const value = $(el).find("td").text().trim();
    if (label && value) attributes[label] = value;
  });

  const weightKg = parseFloat(attributes["Weight"] ?? "");
  const brand =
    ldObj.brand?.name ??
    attributes["Brand"] ??
    ($(".posted_in a[href*='brand'], a[rel='tag'][href*='brand']").first().text().trim() || undefined);

  const urlSlug = new URL(url).pathname.split("/").filter(Boolean).pop() ?? slugify(name);

  return {
    sourceUrl: url,
    sourceType: "SCRAPED",
    slug: slugify(urlSlug),
    name,
    sku: ldObj.sku ?? ($(".sku").first().text().trim() || undefined),
    regularPriceCents,
    salePriceCents,
    stockStatus,
    stockQty: qtyMatch ? parseInt(qtyMatch[1], 10) : undefined,
    shortDescription: stripHtml($(".woocommerce-product-details__short-description").html()),
    description: stripHtml($("#tab-description").html() ?? $(".woocommerce-Tabs-panel--description").html()) ?? stripHtml(ldObj.description),
    categories,
    brand,
    images,
    attributes: Object.keys(attributes).length ? attributes : undefined,
    weightGrams: Number.isFinite(weightKg) ? Math.round(weightKg * 1000) : undefined,
    seoTitle: $("title").first().text().trim() || undefined,
    seoDescription: $("meta[name='description']").attr("content") ?? undefined,
    canonicalUrl: $("link[rel='canonical']").attr("href") ?? url,
    relatedSlugs: $(".related.products a[href*='/product/']")
      .map((_, el) => slugify(new URL($(el).attr("href")!, BASE).pathname.split("/").filter(Boolean).pop()!))
      .get(),
    upsellSlugs: $(".upsells.products a[href*='/product/']")
      .map((_, el) => slugify(new URL($(el).attr("href")!, BASE).pathname.split("/").filter(Boolean).pop()!))
      .get(),
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Crawling ${BASE} (delay ${DELAY_MS}ms)…`);
  await loadRobots();

  const { productUrls, pageUrls } = await discoverUrls();
  console.log(`Discovered ${productUrls.length} product URLs, ${pageUrls.length} content URLs`);

  const products: NormalizedProduct[] = [];
  const targets = LIMIT > 0 ? productUrls.slice(0, LIMIT) : productUrls;
  for (const [i, url] of targets.entries()) {
    const html = await fetchText(url, "product");
    if (!html) continue;
    const product = extractProduct(html, url);
    if (product) products.push(product);
    if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${targets.length} products crawled`);
  }

  // Public content pages (about, contact, policies, services, articles)
  const contentPages: { url: string; title: string; text: string }[] = [];
  const interesting = pageUrls.filter((u) =>
    /about|contact|service|restoration|dream|term|privacy|return|refund|policy|blog|article|faq/i.test(u),
  );
  for (const url of interesting) {
    const html = await fetchText(url, "content");
    if (!html) continue;
    const $ = cheerio.load(html);
    $("script, style, nav, header, footer").remove();
    contentPages.push({
      url,
      title: $("title").text().trim(),
      text: $("main, #content, body").first().text().replace(/\s+/g, " ").trim().slice(0, 20000),
    });
  }

  const { kept, duplicates } = dedupeProducts(products);
  const issues = qualityCheck(kept);

  // Redirect map: old Woo URL -> new route
  const redirectRows = ["from,to"];
  for (const p of kept) {
    if (p.sourceUrl) redirectRows.push(`${new URL(p.sourceUrl).pathname},/products/${p.slug}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, "products.normalized.json"), JSON.stringify(kept, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "pages.json"), JSON.stringify(contentPages, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "source-manifest.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "asset-manifest.json"), JSON.stringify([...assets], null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "redirect-map.csv"), redirectRows.join("\n"));
  fs.writeFileSync(
    path.join(OUT_DIR, "crawl-report.md"),
    [
      `# Crawl report — ${new Date().toISOString()}`,
      "",
      `- Base: ${BASE}`,
      `- URLs fetched: ${manifest.length}`,
      `- Products extracted: ${products.length} (${kept.length} after dedupe, ${duplicates.length} duplicates dropped)`,
      `- Content pages captured: ${contentPages.length}`,
      `- Image assets discovered: ${assets.size}`,
      `- Errors: ${errors.length}`,
      "",
      "## Duplicates",
      ...duplicates.map((d) => `- kept \`${d.kept}\`, dropped \`${d.dropped}\` (${d.reason})`),
      "",
      "## Data quality issues",
      ...issues.map((i) => `- \`${i.slug}\`: ${i.issue}`),
      "",
      "## Errors",
      ...errors.map((e) => `- ${e}`),
    ].join("\n"),
  );

  console.log(`\nDone. ${kept.length} products → ${OUT_DIR}/products.normalized.json`);
  console.log("Next: npx tsx scripts/import-catalog.ts data/crawl/products.normalized.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
