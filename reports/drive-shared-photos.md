# Shared Drive photo folders — inventory (16.08.2026)

Drix shared four folders with the connected Drive account. Contents and how
they map to the catalogue:

## Batch 6 (aamdrive001, 2021) — 38 part-number-named JPGs
`MMR…`, `MM…`, `MMSI-AT…` files, 2–330 KB. These are original Mastodon
product photos. Relevant hits: `MMSI-AT32007.jpg` (upgrade for MMR-32007's
thumbnail-sourced photo). Others cover products that already carry images.

## Batch 11_9 / BATCH 11_9 (aamdrive001, 2021) — 56 JPGs
Same series. Hits: `MMR3001BL.jpg` (real photo of the blue 8.5 mm 90° wire
set — upgrades the CRS-thumbnail version), plus colour variants
(3001/3002/3003 in BK/BL/R) useful if those variants are ever listed.

## KD folder (aamdrive002, shared earlier) — ~27 JPGs
Kyostar-prefixed product photos. Hits: **KD3301 / KD3302 / KD3303** —
the three carbon-fibre ignition switch panels (MMR-3301 Type A,
MMR-3302 Type B, MMR-3303 Type C), 700–1000 px originals. KD3302 carries a
faint seller watermark (bottom-right) — replace if a clean version turns up.
Also `KD3304.jpg`, `KD1005.jpg`, `KD3102.jpg`, `MM-KD…` series for future
listings.

## Catalogue images (info@allamericanmuscle.co.za) — 10 high-res PNGs + xlsm
1–1.5 MB renders of suspension/brake kits (4-link, coil-over, control arm
kits, drop spindles, Ford 9″ housing, 1955-59 crossmember, Mopar spindle).
All ten products are **already in the catalogue with an image** — these are
higher-res replacements for the currently hot-linked photos. Too large to
pull through the Drive connector; grab them during the off-sandbox image
migration (`fetch-product-images.ts` run) or upload the folder here.

## Authorized action run — 16.08.2026 (later the same day)

- **Drive connector limits mapped**: files ≤10 MB download fine (oversized
  MCP responses persist to disk-backed tool-result files — no context cost);
  files >10 MB are rejected server-side. The 21 MB Prosport catalog PDF
  therefore still needs a chat upload or to be split in Drive.
- **aamdrive002's parent folder explored**: siblings are `Enginetech`
  (official part photos incl. `BC200J25.jfif` — the exact SKU — and the
  BB214J rod-bearing series) and `Other` (Edelbrock EDL-…, Holley, MSD,
  Ford C7ZZ/D0ZZ classic parts; `1405.jpg` is an Edelbrock Performer —
  candidate for SSSH0003 pending Drix's confirmation of the model).
- **7 kit products upgraded to the high-res renders** from "Catalogue
  images" (1254 px+ → 1000 px webp, primary image replaced, old-site
  hot-link dependency removed): MMR-31921, CM-CT5559, MMR-CA-5864,
  FLK-AB6872, SP-6370, CA-6370, Ford 9″ housing.
  Three renders have no catalogue product yet (67-72 A-body rear coil-over
  kit, Mopar B/E-body spindle, 64-70 Mustang 4-link) — future listings.
- **BC200J25 attached from AAM's own Enginetech folder** — exact-SKU image,
  removed from the off-sandbox web-fetch list.
- Flag: the Ford 9″ housing SKU is stored as `MMR-9&#8243;-57&#8243;H`
  (HTML entities baked into the SKU by the old site) — worth cleaning up.

## Note for the remaining ~40 products without photos
Batch 6 and 11_9 are two folders of what is clearly a longer batch series.
None of the still-missing part numbers (8591, 5040, 25128, 31068, 09051/2,
11214, PRAUD, 58089, 8513P, PF9-…, 75073/75013…) appear in the shared
folders or anywhere else the connected account can currently see — a Drive
title search for those numbers returns only the KD330x hits above. If
Batches 1–5, 7–10 and 12+ exist, sharing them will likely close most of the
remaining gap.
