# Data quality report — current database state

**Date:** 2026-08-11
**Catalogue state:** **LIVE catalogue imported** — 723 products from the site's public
WooCommerce Store API export (`reports/handover/aam_site_catalogue_20260811.csv`,
captured 11.08.2026), with **approved master pricing applied** to 653 SKUs
(`site_vs_master_price_deltas.csv` — the 09–10.08 master repricing supersedes site prices).
The original 53-product sample seed has been deleted.

## Global status

| Item | Status |
|---|---|
| Products | 723 active (`sourceType=WOO_IMPORT`), all with SKUs; 575 in stock |
| Prices | 653 SKUs at approved master retail (incl. Drix's 10.08 corrections: MMR-3/8 R179.99, BC296J040 R649.99). 35 site SKUs have **no master match** — flagged `needsReview`, reconcile before launch (`reports/handover/site_skus_not_in_master.csv`). Remaining SKUs carry site prices |
| Stock | In-stock yes/no from the Store API; exact quantities known only for 159 low-stock items. "No" was imported as OUT_OF_STOCK — staff should flip backorderable items to BACKORDER in admin |
| Images | 644/723 with live WooCommerce media URLs (served from allamericanmuscle.co.za until assets migrate); **79 without images** — flagged `needsReview`, shoot list in `reports/handover/site_products_without_images.csv` |
| Brands | 607/723 inferred from name prefixes (Mastodon 461, Enginetech 79, Edelbrock, ARP, COMP Cams, Holley, Fel-Pro, Lokar, Speedmaster, Prosport, GUD, Depo, Anchor…); 116 remain unbranded — assign in admin |
| Categories | 19 live categories (site slugs preserved so old `/product-category/…` URLs redirect cleanly); duplicate "Ignitions & Electrical" merged into "Ignition & Electrical" per handover |
| Engine families | 261 products auto-tagged from name/description signals (SBC, Windsor, etc.) — used for POTENTIAL-fitment hints only, never shown as confirmed |
| Fitment records | **None verified yet** for the live catalogue — products honestly show "Compatibility unknown / verification needed" until staff add records (admin → Fitment approvals) |
| Redirects | 733 DB-served 301s covering every old product URL + content pages + pattern fallbacks |
| Trading hours | **VERIFIED** from the live site 11.08.2026 (Mon–Fri 08:00–17:00, Sat 08:00–13:00, Sun closed) — provisional caveat removed |
| Policies | Live site wording (verbatim capture 11.08.2026) with the draft banner retained — the live pages are themselves marked "Starter policy"; awaiting CPA/POPIA sign-off via legal@allamericanmuscle.co.za / Focus Legal |
| Merchandising | 8 featured + 8 best-seller defaults set programmatically — **curate in admin** |

## Outstanding before launch

1. **35 SKUs not in the approved master** — reconcile (mostly MMR-variant codes), flagged `needsReview`.
2. **115 master items under "Price query — JP investigating"** — cannot be identified from this pack; only 33 of the 353 accountant-queue items are on the site at all. When the list arrives, hold or price-gate those SKUs (`apply-price-overrides.ts` or admin).
3. **79 products without photos** — shoot list in handover pack.
4. **Fitment verification** — start with top sellers; every record added in admin is immediately live.
5. **Backorder review** — 148 OUT_OF_STOCK items may be backorderable.
6. **Legal sign-off on policies**, then remove the draft banner in `src/app/policies/[slug]/page.tsx`.
7. **Delivery rates unverified** — flat-rate assumptions (R149/R199, free ≥R2,500 <30 kg) appear nowhere on the live site; Drix to confirm or supply Courier Guy API key.
8. **Post-launch publish list** — the site is a 723-item subset of the 2,937-item master; publishing more is a separate business decision (importer + price overrides are ready for it).

## Repeatable pipeline used

```
npx tsx scripts/import-aam-store-csv.ts reports/handover/aam_site_catalogue_20260811.csv
npx tsx scripts/import-catalog.ts data/import/products.normalized.json --replace-sample
npx tsx scripts/apply-price-overrides.ts data/price-overrides.csv
npx tsx scripts/finalize-live-catalog.ts reports/handover/site_skus_not_in_master.csv
```

`data/price-overrides.csv` (committed) = 653 master retail prices + the two
master-only corrected SKUs (128501-300, MMR-3077) which auto-apply if those
products are ever published.
