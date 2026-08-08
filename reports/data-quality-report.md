# Data quality report — current database state

**Date:** 2026-08-08
**Catalogue state:** development seed (52 sample products) — **not** migrated live data.

## Global status

| Item | Status |
|---|---|
| Products | 52 sample records, all `sourceType=SAMPLE`, all `needsReview=true` |
| Prices | Placeholder values in plausible ZAR ranges. One price (Edelbrock Performer 600 CFM, R8,799.99) comes from the store's own public TikTok post; all others require confirmation |
| Stock levels | Placeholder quantities — replace via import |
| Product images | Blueprint-style category placeholder SVGs; real photography pending asset migration (crawler writes `asset-manifest.json` for bulk download) |
| Fitment records | Seeded from widely-known application data (e.g. Performer EPS fits 1955–86 SBC); marked staff-approved for demo purposes but **must be re-verified by staff before launch** |
| Categories | Full 15-category tree from the brief + subcategories — matches the live store's public category structure |
| Brands | 14 brands from the brief and public information |
| Vehicles | 20 models across Ford/Chevrolet/Dodge/Plymouth/Pontiac with correct production year ranges |
| Articles | 6 original technical articles written for this rebuild (safe to keep) |
| Policies | Drafts clearly marked DRAFT in the UI — replace with official store wording |
| Trading hours | Assumed — flagged “provisional” on /contact |

## Incomplete / uncertain items requiring attention before launch

1. **Replace the sample catalogue** — run the WooCommerce CSV import (preferred) or the crawler, then `--replace-sample`.
2. **Verify all fitment records** — admin → Fitment approvals; the seed data is
   demonstrative. Never mark a fitment CONFIRMED without checking the
   manufacturer application guide.
3. **Real product photography** — download via `asset-manifest.json` from the
   crawl (or the Woo export's image URLs) into `/public/products/` or a CDN,
   then re-run the importer.
4. **Official policy text** — terms, privacy/POPIA, returns.
5. **Trading hours + public holidays** — confirm with the workshop.
6. **PayFast production credentials** — currently sandbox defaults.
7. **The Courier Guy API key** — flat-rate fallback is active until set.

## Duplicate handling

The importer dedupes by SKU (primary) then normalised name (secondary) and
reports every dropped row in `data/import/import-quality-report.md`.

## Weak-description detection

Products with descriptions under 80 characters are flagged in the import
quality report and set `needsReview=true` so staff can improve them in admin.
