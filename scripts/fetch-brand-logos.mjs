#!/usr/bin/env node
/**
 * Collect brand/manufacturer logo CANDIDATES for human review.
 * Runs in GitHub Actions (open internet). Writes raw files + manifest to
 * reports/logo-candidates/ — nothing goes live without review.
 *
 * Sources, in order: known Wikipedia logo files, Wikipedia infobox lookup,
 * the brand's own homepage (og:image + header <img> with "logo" in the URL).
 */
import fs from "node:fs";
import path from "node:path";

const OUT = "reports/logo-candidates";
fs.mkdirSync(OUT, { recursive: true });

const UA = { "User-Agent": "Mozilla/5.0 (compatible; AAM-website-build/1.0; +https://allamericanmuscle.co.za)" };

// Wikipedia files already confirmed via infobox lookup.
const WIKI_FILES = {
  "make-ford": "Ford_logo_flat.svg",
  "make-chevrolet": "Chevrolet_(logo).svg",
  "make-dodge": "Dodge_2022_logo.svg",
  "make-plymouth": "Plymouth_logo.svg",
  edelbrock: "Edelbrock_logo.svg",
  holley: "Holley_Performance_Products_logo.svg",
  "ford-racing": "Ford_Racing_2025_Logo.png",
};

// Wikipedia article titles still to try for an infobox logo/image.
const WIKI_ARTICLES = {
  "make-pontiac": "Pontiac",
  moog: "MOOG (automotive parts)",
  "fel-pro": "Fel-Pro",
  "comp-cams": "Comp Cams",
  "ap-racing": "AP Racing",
  arp: "Automotive Racing Products",
};

// Brand homepages for logo scraping.
const SITES = {
  "ap-racing": "https://apracing.com",
  arp: "https://arp-bolts.com",
  "comp-cams": "https://www.compcams.com",
  depo: "https://www.depoautolamp.com",
  dynacorn: "https://dynacorn.com",
  enginetech: "https://enginetech.com",
  "fel-pro": "https://www.felpro.com",
  gud: "https://gud.co.za",
  lokar: "https://lokar.com",
  msd: "https://www.msdperformance.com",
  moog: "https://www.moogparts.com",
  prosport: "https://prosportgauges.com",
  speedmaster: "https://www.speedmaster79.com",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const manifest = [];

async function get(url, type = "text") {
  const res = await fetch(url, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${res.status}`);
  return type === "buf" ? Buffer.from(await res.arrayBuffer()) : await res.text();
}

function extFor(url, contentTypeGuess) {
  const m = url.split("?")[0].match(/\.(svg|png|jpe?g|webp|gif|avif)$/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : contentTypeGuess || "png";
}

async function saveCandidate(slug, kind, url) {
  try {
    const buf = await get(url, "buf");
    if (buf.length < 500 || buf.length > 3_000_000) throw new Error(`size ${buf.length}`);
    const file = `${slug}--${kind}.${extFor(url)}`;
    fs.writeFileSync(path.join(OUT, file), buf);
    manifest.push({ slug, kind, url, file, bytes: buf.length });
    console.log(`  saved ${file} (${buf.length} B)`);
    return true;
  } catch (e) {
    console.log(`  skip ${kind}: ${url.slice(0, 90)} (${e.message})`);
    return false;
  }
}

// 1. Known Wikipedia files (rasterized at 600px for SVGs).
for (const [slug, fname] of Object.entries(WIKI_FILES)) {
  console.log(slug);
  await saveCandidate(slug, "wiki", `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(fname)}?width=600`);
  await sleep(800);
}

// 2. Remaining Wikipedia infobox lookups.
for (const [slug, title] of Object.entries(WIKI_ARTICLES)) {
  console.log(slug);
  try {
    const q = new URLSearchParams({ action: "query", titles: title, prop: "revisions", rvprop: "content", rvslots: "main", format: "json", redirects: "1" });
    const data = JSON.parse(await get(`https://en.wikipedia.org/w/api.php?${q}`));
    const page = Object.values(data.query.pages)[0];
    const text = page?.revisions?.[0]?.slots?.main?.["*"] ?? "";
    const m = text.match(/\|\s*(?:logo|image)\s*=\s*(?:\[\[(?:File|Image):)?([^|\]\n]+?\.(?:svg|png|jpe?g|webp))/i);
    if (m) {
      const fname = m[1].trim().replace(/ /g, "_");
      await saveCandidate(slug, "wiki", `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(fname)}?width=600`);
    } else console.log("  no infobox logo");
  } catch (e) {
    console.log(`  wiki lookup failed: ${e.message}`);
  }
  await sleep(1200);
}

// 3. Brand homepages: og:image + header imgs containing "logo".
for (const [slug, site] of Object.entries(SITES)) {
  console.log(slug, site);
  try {
    const html = await get(site);
    const cands = new Set();
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i) ||
               html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (og) cands.add(og[1]);
    for (const m of html.matchAll(/<img[^>]+src=["']([^"']*logo[^"']*)["']/gi)) cands.add(m[1]);
    for (const m of html.matchAll(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)/gi)) cands.add(m[1]);
    let n = 0;
    for (let url of cands) {
      if (n >= 3) break;
      if (url.startsWith("//")) url = "https:" + url;
      else if (url.startsWith("/")) url = site.replace(/\/$/, "") + url;
      else if (!url.startsWith("http")) url = site.replace(/\/$/, "") + "/" + url;
      if (await saveCandidate(slug, `site${n}`, url)) n++;
    }
    if (n === 0) console.log("  no usable candidates");
  } catch (e) {
    console.log(`  homepage failed: ${e.message}`);
  }
  await sleep(500);
}

fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`\n${manifest.length} candidate files saved to ${OUT}`);
