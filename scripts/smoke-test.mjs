#!/usr/bin/env node
/**
 * Launch smoke test — run against any deployment of the store:
 *
 *   node scripts/smoke-test.mjs https://<preview>.vercel.app
 *   node scripts/smoke-test.mjs http://localhost:3000
 *
 * Checks the customer journey surface, legacy-SEO redirects, sitemap/robots,
 * the search API and security headers. Exits non-zero if anything fails,
 * printing a pass/fail line per check — paste the output back to the
 * rebuild assistant for diagnosis.
 */

const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!/^https?:\/\//.test(base)) {
  console.error("Usage: node scripts/smoke-test.mjs <base-url>");
  process.exit(1);
}

let pass = 0, fail = 0;
const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    pass++;
    results.push(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (err) {
    fail++;
    results.push(`✗ FAIL  ${name} — ${err.message}`);
  }
}

const get = (path, opts = {}) =>
  fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(20000), ...opts });

async function body200(path, mustContain) {
  const res = await get(path, { redirect: "follow" });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  for (const s of Array.isArray(mustContain) ? mustContain : [mustContain]) {
    if (!text.toLowerCase().includes(s.toLowerCase())) throw new Error(`missing "${s}"`);
  }
  return `${(text.length / 1024).toFixed(0)} KB`;
}

// --- storefront journey ---
await check("home page", () => body200("/", ["All American", "garage"]));
await check("shop listing", () => body200("/shop", "add to basket"));
await check("category page", () => body200("/shop?category=engines-components", "product"));
await check("search page (alias query)", () => body200("/search?q=SBC+bearing", ["SBC", "product"]));
await check("product page + structured data", () =>
  body200("/products/mastodon-7-vacuum-dual-power-brake-booster-chrome", ["application/ld+json", "MMR-700C"]));
await check("supplier photo serves", async () => {
  const res = await get("/products/live/supplier-mmr-700c.webp", { redirect: "follow" });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
  return type;
});
await check("garage page", () => body200("/garage", "vehicle"));
await check("basket page", () => body200("/basket", "basket"));
await check("checkout page (empty cart -> basket)", async () => {
  const res = await get("/checkout", { redirect: "follow" });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  const text = (await res.text()).toLowerCase();
  if (!text.includes("checkout") && !text.includes("basket")) throw new Error("neither checkout nor basket rendered");
  return;
});
await check("policies page", () => body200("/policies/returns", "return"));

// --- legacy SEO redirects ---
await check("legacy /product/ URL redirects", async () => {
  let path = "/product/mastodon-7-vacuum-dual-power-brake-booster-chrome/";
  for (let hop = 0; hop < 3; hop++) {
    const res = await get(path);
    if (![301, 307, 308].includes(res.status)) throw new Error(`HTTP ${res.status} at ${path}, expected redirect`);
    path = new URL(res.headers.get("location") ?? "", base).pathname;
    if (path.startsWith("/products/")) return `resolved in ${hop + 1} hop(s)`;
  }
  throw new Error(`did not reach /products/ (ended at ${path})`);
});
await check("merged category redirect", async () => {
  const res = await get("/product-category/ignitions-electrical/");
  if (![301, 307, 308].includes(res.status)) throw new Error(`HTTP ${res.status}, expected redirect`);
  return `${res.status} -> ${res.headers.get("location")}`;
});

// --- crawlers ---
await check("sitemap.xml", async () => {
  const res = await get("/sitemap.xml", { redirect: "follow" });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const urls = (text.match(/<loc>/g) ?? []).length;
  if (urls < 100) throw new Error(`only ${urls} URLs`);
  return `${urls} URLs`;
});
await check("robots.txt", () => body200("/robots.txt", "sitemap"));

// --- APIs ---
await check("search API", async () => {
  const res = await get("/api/search?q=302", { redirect: "follow" });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const n = json.products?.length ?? json.results?.length ?? json.length ?? 0;
  if (!n) throw new Error("no results for '302'");
  return `${n} results`;
});
await check("vehicle data API", async () => {
  const res = await get("/api/vehicle-data", { redirect: "follow" });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  return;
});

// --- hardening ---
await check("security headers", async () => {
  const res = await get("/", { redirect: "follow" });
  const missing = ["x-frame-options", "x-content-type-options", "referrer-policy"]
    .filter((h) => !res.headers.get(h));
  if (missing.length) throw new Error(`missing: ${missing.join(", ")}`);
  return;
});
await check("404 for unknown page", async () => {
  const res = await get("/definitely-not-a-real-page-xyz", { redirect: "follow" });
  if (res.status !== 404) throw new Error(`HTTP ${res.status}, expected 404`);
  return;
});
await check("admin requires login", async () => {
  const res = await get("/admin");
  const text = res.status === 200 ? await res.text() : "";
  const gated = [301, 302, 307, 308, 401, 403].includes(res.status) ||
    (res.status === 200 && /type="password"/i.test(text));
  if (!gated) throw new Error(`admin reachable without login (HTTP ${res.status})`);
  return;
});

console.log(`\nSmoke test against ${base}\n`);
console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
