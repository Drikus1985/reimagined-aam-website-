# Deployment runbook — Vercel (cpt1) + Supabase Postgres (af-south-1)

Target per the 11.08.2026 handover: Vercel with functions in Cape Town (`cpt1`)
+ Supabase Postgres in `af-south-1` for lowest South African latency.
(Alternative: Neon EU Frankfurt, accept ~150 ms to the DB.)

## 1. Database (Supabase)

1. Create a Supabase project in **af-south-1 (Cape Town)**.
2. From *Project settings → Database*, copy both connection strings:
   - **Transaction pooler (port 6543)** → app's `DATABASE_URL` (append `?pgbouncer=true&connection_limit=1`)
   - **Direct (port 5432)** → used only for migrations
3. Apply schema and load data (from your machine, repo checked out):
   ```bash
   export DATABASE_URL="<direct 5432 connection string>"
   npx prisma migrate deploy
   npx prisma db seed                    # articles, vehicles, engine families, knowledge, sample catalogue
   npm run import:aam reports/handover/aam_site_catalogue_20260811.csv
   npm run import:catalog data/import/products.normalized.json -- --replace-sample
   npm run import:prices data/price-overrides.csv
   npx tsx scripts/finalize-live-catalog.ts reports/handover/site_skus_not_in_master.csv
   ```
   (Seed is safe here: it only refuses when imported data already exists.)

### 1b. Migrate product photography (recommended, before or after first deploy)

The catalogue currently hot-links 644 photos from the old site's media
library (with graceful placeholder fallback). To make the new site
independent of the old host, run — from any machine that can reach
allamericanmuscle.co.za (the rebuild sandbox cannot):

```bash
DATABASE_URL="<direct 5432 connection string>" npx tsx scripts/fetch-product-images.ts
```

Downloads every image to `public/products/live/`, repoints the DB rows, and
writes `reports/image-migration-report.md`. Use `--dry-run` to preview,
`--keep-remote` to download without repointing. Commit the folder (or upload
it to a CDN and adjust URLs), then redeploy. The full URL list is in
`reports/asset-manifest.csv`.

Then attach the supplier-sourced photos for products that never had images
(29 curated in `data/supplier-images/`, see
`reports/supplier-image-sources.md`):

```bash
DATABASE_URL="<direct 5432 connection string>" npx tsx scripts/attach-product-images.ts data/supplier-images
```

## 2. Vercel project

1. Import the GitHub repo into Vercel (framework auto-detects Next.js;
   `vercel.json` pins `cpt1` and the build command runs `prisma generate`).
2. Set environment variables (*Settings → Environment Variables*, Production):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Supabase **pooler** string (6543, `?pgbouncer=true&connection_limit=1`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (no trailing slash) |
   | `ADMIN_PASSWORD` / `SESSION_SECRET` | strong random values |
   | `AI_PROVIDER` / `ANTHROPIC_API_KEY` / `AI_MODEL` | `anthropic` / key / `claude-opus-5` (or leave `mock`) |
   | `PAYFAST_MERCHANT_ID` / `PAYFAST_MERCHANT_KEY` / `PAYFAST_PASSPHRASE` | production values from the PayFast dashboard |
   | `PAYFAST_SANDBOX` | `false` |
   | `COURIER_GUY_API_KEY` | Shiplogic key (empty = flat-rate fallback) |
   | `SMTP_HOST/PORT/SECURE/USER/PASS/FROM`, `ORDERS_NOTIFY_EMAIL`, `LEADS_NOTIFY_EMAIL` | mail settings (empty = audited no-op) |

3. Deploy, then point the domain at Vercel.

## 3. Post-deploy checklist

- [ ] `https://<domain>/api/payfast/itn` set as the notify URL context — run one **sandbox** payment first (`PAYFAST_SANDBOX=true` on a preview deployment), confirm the order flips to PAID and stock decrements, then flip to production credentials.
- [ ] PayFast dashboard: enable ITN, set passphrase to match `PAYFAST_PASSPHRASE`.
- [ ] Walk the smoke path: home → garage → shop?fit=vehicle → PDP → basket → checkout → PayFast → result page.
- [ ] `/admin`: log in, spot-check products/prices, work the `needsReview` queue (35 no-master-match SKUs + 79 without photos).
- [ ] Old-URL SEO: request a handful of old `/product/...` URLs, confirm 301s.
- [ ] Search Console: submit `https://<domain>/sitemap.xml`.
- [ ] Rate limiting is in-memory per instance — fine at launch scale; move to Redis (Upstash) if traffic grows or instances multiply.
- [ ] Cut over DNS only after the sandbox payment test passes.

## 4. Updating data in production

- Prices: `npm run import:prices <SKU,Price csv>` against the direct connection.
- Catalogue sync: re-run the import pipeline (idempotent by slug).
- Fitment: admin UI, or bulk-insert `Fitment` rows (`source=STAFF, approved=true`).
- Never run `prisma db seed` against production (it refuses, but don't try).
