# Crawl report — build environment

**Date:** 2026-08-08
**Target:** https://allamericanmuscle.co.za/

## Outcome: crawl blocked by build-environment network policy

The rebuild was developed in a sandboxed remote environment whose egress
proxy **denies all outbound connections to `allamericanmuscle.co.za`**
(HTTP CONNECT returns `403 Forbidden` — policy denial at the gateway, before
any traffic reaches the site). Both direct fetches and the environment's
web-fetch service returned `EGRESS_BLOCKED` for the domain.

This means:

- `robots.txt`, the sitemap, and product pages could **not** be fetched here.
- **No live catalogue data was scraped.** Nothing in this repository is
  copied from the live site's product database.
- The ~619-product live catalogue must be migrated by running the tooling
  below from a machine with normal internet access, or from a WooCommerce
  export supplied by the store owner.

## What was gathered instead (public search results only)

Business information visible in public search-engine results was used for
contact details, address, brand list and positioning copy (see
`reports/source-manifest.json` for attribution). A small number of real
product names/URLs appeared in public results and were used to seed the
redirect map and representative sample products — all flagged
`sourceType=SAMPLE`, `needsReview=true`.

## Migration paths (both implemented and repeatable)

1. **Crawler** — `npx tsx scripts/crawl-site.ts`
   - Sitemap-first discovery, robots.txt honoured, 1.5s default delay,
     identifies itself via User-Agent, public catalogue/content pages only.
   - Extracts WooCommerce JSON-LD + DOM data, normalises, dedupes, writes
     quality report, source manifest, asset manifest and redirect map.
2. **WooCommerce CSV export** — `npx tsx scripts/import-woocommerce-csv.ts export.csv`
   - Accepts the standard "Export products" CSV from WooCommerce admin.
   - Same normalized output; no crawling required. **Recommended** since the
     store owner commissioned this rebuild — the export includes stock and
     prices with full fidelity, and avoids load on the live site.

Then load either output with:

```
npx tsx scripts/import-catalog.ts data/import/products.normalized.json --replace-sample
```

## Etiquette safeguards in the crawler

- Honours `robots.txt` Disallow rules
- ≥1.5 s delay between requests (configurable, never parallel)
- Sitemap-first (minimises page fetches)
- Public pages only — never touches `/my-account`, `/cart`, `/checkout`,
  `/wp-admin`, or any authenticated surface
- Transparent User-Agent naming the store contact address
