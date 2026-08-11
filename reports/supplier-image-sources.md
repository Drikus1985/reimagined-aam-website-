# Supplier image sources on Google Drive — search findings (11.08.2026)

Search request: supplier catalogs, invoices etc. containing product images,
under Rodco, CRS, Suppliers and similar. Goal: candidate photography for the
79 catalogue products without photos (`reports/handover/site_products_without_images.csv`)
and general imagery for the new site.

## Where the images are

### 1. Supplier order books with embedded per-part photos (best per-SKU source)

These .xlsx files carry a product photo anchored to each part-number row —
exactly the format `scripts/extract-supplier-images.mjs` extracts.

| File (Drive) | Folder | Size | Notes |
|---|---|---|---|
| `Rodco 13.05.2026.xlsx` | Suppliers / Rodco Beyond | 21.5 MB | Largest photo set; SI-AT… part numbers |
| `Rodco 09.07.2026.xlsx` | Suppliers / Rodco Beyond | 5.4 MB | Newer, smaller |
| `CRS 15.07.2026.xlsx` | Suppliers / CRS - China Racing Supply | 10.2 MB | Confirmed "Pic" column |
| `CRS-Street Rod Parts 13.05.2026.xlsx` | Suppliers / CRS | 6.5 MB | Street-rod range |
| `CRS_Sales_Confirm_List_-_AAM-New_PO_-_Split_by_Availability` (Google Sheet, 2 copies) | My Drive | 10.9 MB | "Photo" column; download as .xlsx first |
| `AAM_Mastodon_Dealer_Order_Book` (Google Sheet, several copies) | My Drive | 3.9–6.6 MB | Mastodon's own numbering; download as .xlsx |
| `RODCO Quote 08.01.2025.xlsx` | Supplier Invoices / Rodco Beyond | 0.8 MB | Older quote |
| `CRS INV-AAM25102202.xlsx`, `INVOICE-AAM Sample List UPDATED -2025.6.12-1.xlsx` | Supplier Invoices / Forshan CRS | 1.8 / 1.5 MB | Invoice-format, some photos |

Drive links are in the folders: *Suppliers* (`14GtpBU3-QeOz9CdeYPfYJlRQTnnra6_N`),
*Supplier Invoices* (`1xUbx9DdBWdJrUewRx38UP742HjWZE1BD`).

### 2. Supplier PDF catalogues (browse/crop source, no row mapping)

- `BEYOND CATALOG .pdf` — Rodco Beyond Catalog folder, 2.9 MB
- `Performance catalog.pdf` — Suppliers / Prosport Gauges, 21 MB → **covers the
  Prosport gauges in the missing-photo list** (NO.94, 216 SWOT-BBB, PSM6GCC-RW,
  WA6037B(C), MM6GSETESPR-CG-GPS, MMR-67003-style gauge kits)
- `Aopec Starters & Alternators.pdf` — Suppliers / Aopec, 7.6 MB
- GRWA exhaust stock list + quotation PDFs — Suppliers / CRWA Exhaust
- `ANF_Product_Catalogue_2026.pdf` (15.9 MB) + **AN Catalogue-ecom Images /
  AN Catalogue images folders** (shared by a.n.fittings000) — ready-made
  e-commerce images for the AN-fittings range

### 3. Professional photoshoot (BrazBez Media) — hero/content imagery

`FIRE SALE` folder (`10S2IZjPu0rfvl6lA4jI2uWFqteN9LYYz`), July 2026, 4–10 MB
JPGs: **Cars** (per-car folders, e.g. 2008 Chrysler 300C), **Engine & Parts**,
**Sport Seats**, **Mastodon Lifts**, **Vintage Tokheim petrol pump**. Ideal for
home-page heroes, Dream Builds, services and fire-sale merchandising rather
than per-SKU catalogue photos.

## Why this covers most of the 79 missing photos

- ~50 of the 79 are `MMR-…` Mastodon parts. Mastodon's numeric cores line up
  with Rodco's `SI-AT…` numbers (verified: MMR-25013 "Polished Alternator
  Bracket For Long Water Pump" ↔ SI-AT25013 "SBC 350 LWP Aluminum Alternator
  Bracket Kit, Polished"). The extractor's numeric-core matcher automates this.
- Several missing SKUs are literally CRS part numbers: `TSC-7007B-1`,
  `WHK-2100`, `SI-AT26194` (Rodco), etc. — exact matches in the order books.
- Prosport gauge SKUs → Prosport Performance catalog PDF.
- `AND SHIFT-2` (Quicksilver shifter) → Supplier Invoices / "Alibaba / Foshan
  Baibai Trade Co / Shifter" folder.
- Likely no supplier imagery found for: Borgeson (BRG-…), Enginetech bearings
  (BC200J25), lifters (L817/L900), engine blocks (BLK…), Smoothie wheel
  (FT1502/10) — these need photos from those brands or in-house shots.

## How to run it (on the Mac — the rebuild sandbox can't reach Drive files)

```bash
# 1. Download the .xlsx order books from Drive (Google Sheets: File → Download → .xlsx)
# 2. Extract + auto-match against the missing-photo list:
node scripts/extract-supplier-images.mjs \
  "Rodco 13.05.2026.xlsx" "Rodco 09.07.2026.xlsx" \
  "CRS 15.07.2026.xlsx" "CRS-Street Rod Parts 13.05.2026.xlsx" \
  "AAM_Mastodon_Dealer_Order_Book.xlsx" \
  --missing reports/handover/site_products_without_images.csv \
  --out supplier-images

# 3. Eyeball supplier-images/matched/ — delete anything that isn't the right part.
#    (numeric-core matches are suggestions, not confirmations)

# 4. Attach the approved ones to the catalogue (needs DATABASE_URL):
npx tsx scripts/attach-product-images.ts supplier-images/matched --dry-run   # preview
npx tsx scripts/attach-product-images.ts supplier-images/matched             # write

# 5. Commit public/products/live/ and redeploy (same as the §1b image migration).
```

`supplier-images/image-map.csv` lists every extracted photo with its workbook,
row, part number, description and any matched site SKU — useful for manually
resolving the rest.

**Rights note:** supplier photos are fine for listing the supplier's own parts
(that's what they're distributed for), but confirm with Rodco/CRS/Prosport
before reusing their imagery for branding or marketing beyond product listings.

---

## Executed 11.08.2026 — first extraction run (uploaded books)

Drix uploaded `Rodco 09.07.2026.xlsx`, `CRS 15.07.2026.xlsx`,
`CRS-Street Rod Parts 13.05.2026.xlsx`, `CRS Stock List 13.05.2026.xlsx` and
the GRWA quotation PDF. Results:

- **1,676 images extracted** (full index: `reports/supplier-image-map.csv`);
  6 more header/valve photos pulled from the GRWA PDF.
- **29 products that had no photo now have one** — verified by description
  *and* visual check, enhanced (Lanczos upscale capped at 4×, unsharp mask,
  white background, square canvas, webp) and attached. Sources are Excel
  thumbnails (mostly 80–280 px), so output is 400–800 px: crisp on cards,
  acceptable on product pages. SKU-named set committed in
  `data/supplier-images/`; served copies in `public/products/live/supplier-*`.
- Attached SKUs: MMR-09057-BK/R, MMR-11225, MMR-25005, MMR-25013, MMR-25030,
  MMR-25050, MMR-25054, MMR-25095, MMR-25106, MMR-26086, MMR-28137, MMR-32007,
  MMR-38021-BK, MMR-41021, MMR-45018, MMR-67003, MMR-81009, MMR32057,
  MMR-CM-34448, MMR-CM-34457, MMR-CM-D11193, MMR-700C, MMR-32024-B, 300-160,
  UJ006, SI-AT26194, TSC-7007B-1, WHK-2100.
- **Rejected matches** (photo would misrepresent the product):
  WHK-3001 LS standalone harness ≠ MMR-3001BL ignition wire set;
  07-0801 T-bar wing nuts ≠ MMR-11214 Minitab hold-downs;
  07-0205 SBF gasket engine unconfirmed for MMR-58089.
- **Needs Drix's call**: DIS-8360 billet distributor for KNDI-002 "V8
  Distributor" (plausible, brand unconfirmed); steering column length/finish
  for MMR-8513P; CRS oil pans vs MMR-75013/75073.
- **50 products still without photos.** Best next sources: the bigger
  `Rodco 13.05.2026.xlsx` (21.5 MB — not yet uploaded, likely has the missing
  SI-AT parts and larger originals), the Mastodon Dealer Order Book sheets,
  and the Prosport Performance catalog PDF for the gauge SKUs. Borgeson /
  Enginetech / engine blocks / Smoothie wheel need brand or in-house photos.

Production: run `npx tsx scripts/attach-product-images.ts data/supplier-images`
against the production DB (see docs/DEPLOYMENT.md §1b).

## Round 2 — 11.08.2026 (Rodco 13.05 book + web sourcing)

- `Rodco 13.05.2026.xlsx` extracted (917 images): same thumbnail sizes as the
  09.07 book — its 21.5 MB is more rows plus a few full-res camera shots of
  parts we already cover. No photo upgrades gained; no new SKU matches.
- **5 more products attached** (total now 34): MMR-3001BL (CRS 01-0406-BL,
  8.5mm 90° blue wire set), MMR-009-BLK (CRS CR-009-BLK trans mount — same
  part-number core), and the three IFS kits MMR-CM-CT47541FS /
  MMR-CM-FT53561FS / MMR-CM-FT57601FS (site SKUs are OCR-garbled CRS numbers:
  CT4754IFS, FT5356IFS, FT5760IFS — "IFS" became "1FS").
- **Web candidates for 16 more SKUs** compiled for Drix's confirmation —
  `reports/web-image-candidates.csv` (machine-readable) and the review page
  at the "Product Photo Candidates" artifact. Highlights: Enginetech official
  catalog images follow `enginetechcatalog.com/partimages/<PART>.jpg`
  (L817, L900, BC200J); the BRG- SKUs are Summit codes → Borgeson
  `borgeson.com/images/product/D/<num>.jpg`; "Quicksilver Shifter" is the
  B&M 81683. Flagged: BC200J is Enginetech's MAIN bearing set for 289/302
  (rod bearing is BB214J) — the product name and SKU disagree.
- Still needing input: Prosport gauge sets (exact photos are in the Prosport
  "Performance catalog.pdf" in Drive — upload to extract), the distributor /
  steering column / oil pan / gasket variant picks, and in-house shots for
  the remaining Mastodon house-brand items and used engine blocks.
- Remaining without photos: **45**.

## Round 2 confirmation — Drix sign-off 11.08.2026

All web candidates confirmed. Actions:

- **KNDI-002 attached** immediately from the extracted CRS DIS-8360 photo
  (total attached: **35**; 44 remaining).
- **12 confirmed web images** baked into `scripts/fetch-web-images.mjs`
  (the sandbox gateway blocks these hosts, so run it from the Mac):
  ```bash
  node scripts/fetch-web-images.mjs
  DATABASE_URL="<direct>" npx tsx scripts/attach-product-images.ts data/supplier-images
  ```
  Covers: L817, L900, BC200J25, BRG-114925, BRG-014949, AND SHIFT-2,
  KD2020, KD6078, FT1502/10, NO.94, WA6037B(C), M192704455679.
  Status per SKU tracked in `reports/web-image-candidates.csv`.
- Still pending input: Prosport catalog PDF upload (3 gauge sets), steering
  column / oil pan / gasket variant picks, SSSH0003 clarification, in-house
  shots for the rest.
