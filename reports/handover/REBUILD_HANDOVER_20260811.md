# AAM Website Rebuild — Handover Pack (11 Aug 2026)

Prepared in the AAM inventory Cowork session on Drix's instruction ("action and complete — you have authority"), answering the rebuild session's outstanding-needs list item by item. Everything below is labelled Verified / Unable to verify / Recommendation per AAM data rules.

## 1. The real catalogue — DONE (public-data version)

`aam_site_catalogue_20260811.csv` — full live catalogue pulled 11.08.2026 from allamericanmuscle.co.za via the site's own public WooCommerce Store API (fetched in Drix's browser on-origin; the rebuild environment couldn't reach the domain, this one could).

- **723 products** (server header X-WP-Total: 723 — complete set), all type "simple", **723/723 with SKU**, 644 with image URLs, 575 in stock, 1 on sale.
- Columns: ID, SKU, Name, Slug, Permalink, Type, Current/Regular/Sale price (R, as displayed on site = VAT-inclusive), On sale, In stock, Low stock remaining, Categories, Category slugs, Image URLs, Short description, Description (text).
- **Redirect map input:** the Permalink + Slug columns are the old URLs, keyed by SKU/ID.
- **What this export cannot contain** (WP-admin-only fields): cost prices, product meta, draft/private products, customer/order data. Cost + approved pricing live in `AAM_Master_Inventory_20260809.xlsx` (this project).

**CRITICAL pricing instruction for the importer:** use this export for content (slugs, images, descriptions, categories) but take PRICES from the approved master, not from the site. 653 of the 688 master-matched products have site prices that differ from the approved master retail (see `site_vs_master_price_deltas.csv`, sorted by magnitude — the master repricing of 09–10.08 supersedes the site). 4 items were explicitly corrected by Drix on 10.08 (MMR-3/8 → R179.99 each, BC296J040 → R649.99, 128501-300 → R919.99, MMR-3077 → R3,999.99); the site still shows old prices (MMR-3/8 R1,200; BC296J040 R850).

Quality files: `site_vs_master_price_deltas.csv` (653 rows) · `site_skus_not_in_master.csv` (35 site SKUs with no master match — mostly MMR-variant codes, reconcile before import) · `site_products_without_images.csv` (79 rows). Also note: the site's category list contains a duplicate pair — "Ignition & Electrical" (1 product) vs "Ignitions & Electrical" (64) — merge on import; and 115 master items are under "Price query — JP investigating" (hold or price-gate those on the new site until resolved). Only 33 of the 353 accountant-queue items appear on the live site at all — the site is a 723-item subset of the 2,937-item approved master, so a post-launch publish list is a separate decision.

## 2. Business confirmations

- **Trading hours — VERIFIED from live site** (https://allamericanmuscle.co.za/contact-us/, 11.08.2026): "Monday – Friday | 08:00 – 17:00", "Saturday | 08:00 – 13:00", Sunday closed. Also verified there: Phone 010 592 1706 · WhatsApp 072 042 6477 · parts@allamericanmuscle.co.za · 15 Tarry Rd, Alrode South, Alberton, 1451. Replace the /contact "provisional" values with these.
- **Policies — NO official version exists.** The live site's own terms/privacy/returns pages are explicitly marked "Starter policy … review with your legal advisor". Verbatim captures: `policy_terms_live_20260811.md`, `policy_privacy_live_20260811.md`, `policy_returns_live_20260811.md`. Keep the rebuild's draft markers until legal sign-off — Drix has legal@allamericanmuscle.co.za and Monique at Focus Legal (monique@focuslegal.co.za) in the loop; route the three drafts to them for CPA/POPIA sign-off.
- **Delivery / free-shipping rules — UNABLE TO VERIFY.** Assumed R149 main centres / R199 regional / free over R2,500 under 30 kg appears nowhere on the live site (terms only say "shipped via The Courier Guy; timeframes are estimates", homepage says "nationwide delivery" with no rates; the store API cart exposes no rates). This is a business decision only Drix can confirm — keep the assumption clearly labelled until he does.

## 3. Credentials — user-only, not actioned

Not something an assistant can or should handle. Drix: set directly in the deployment's `.env`, never in chat — PayFast production merchant ID/key/passphrase; The Courier Guy (Shiplogic) API key; Anthropic API key (`AI_PROVIDER=anthropic`); SMTP details. Everything degrades gracefully until then (sandbox PayFast, flat-rate shipping fallback, mock AI, no emails).

## 4. Decisions (recommendations — Drix to ratify)

- **PR #1:** merge once the real-catalogue import from this pack lands and CI is green — merging the sample-catalogue state first then importing on main also works; no repo access from this session (no gh auth, no connected repo folder), so the merge is Drix's or the rebuild session's to execute.
- **Deploy target — recommendation:** Vercel (Next.js-native) with functions/region set to `cpt1` (Cape Town) + Supabase Postgres in `af-south-1` (Cape Town) for lowest SA latency; Neon has no African region. Standard alternative if Supabase is unwanted: Neon EU (Frankfurt) and accept ~150ms.
- **Photography:** 644/723 products carry usable image URLs in the export (Woo media library) — item 1 mostly solves this; the 79 gaps are listed for a shoot list.

## Files in this pack
aam_site_catalogue_20260811.csv · site_vs_master_price_deltas.csv · site_skus_not_in_master.csv · site_products_without_images.csv · policy_terms_live_20260811.md · policy_privacy_live_20260811.md · policy_returns_live_20260811.md · REBUILD_HANDOVER_20260811.md (this file)

A copy of the whole pack is in ~/Downloads/AAM_rebuild_handover/ on Drix's Mac for dropping into the repo / rebuild session.
