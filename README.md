# All American Muscle — E-commerce Platform

A ground-up rebuild of [allamericanmuscle.co.za](https://allamericanmuscle.co.za) as a premium,
conversion-focused store for American muscle car parts, restorations and engine builds,
with vehicle-fitment intelligence and an embedded AI parts specialist.

> **Catalogue status:** the database currently holds a clearly-flagged **sample catalogue**
> (`sourceType=SAMPLE`, `needsReview=true`). The live site could not be crawled from the build
> environment (network egress blocked — see `reports/crawl-report.md`). Run one of the importers
> below to migrate the real ~619-product catalogue.

## Architecture

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Server components for all catalogue pages; small client islands (cart, garage, chat, checkout form) |
| Styling | Tailwind CSS 4 | Dark charcoal / warm white / restrained red workshop identity, defined in `src/app/globals.css` |
| Database | PostgreSQL + Prisma 6 | Schema in `prisma/schema.prisma` |
| Search | MiniSearch (in-process) behind `searchCatalog()` | Fuzzy + prefix + specialist alias expansion (SBC, BBC, 302…). Swap for Meilisearch/Typesense by reimplementing one module (`src/lib/search.ts`) |
| Payments | PayFast (sandbox-ready) | Signed form POST + verified ITN webhook (`src/lib/payfast.ts`, `src/app/api/payfast/itn`) |
| Delivery | The Courier Guy (Shiplogic) boundary | `ShippingProvider` interface with configurable flat-rate fallback (`src/lib/shipping.ts`) |
| AI | Provider abstraction: Anthropic Claude or offline mock | Manual tool loop with grounding guard (`src/lib/ai/`) |
| RAG | Keyword retrieval over approved `KnowledgeChunk` rows | `src/lib/ai/retrieval.ts` is the single swap point for a vector store (pgvector column already in schema) |
| Cart / Garage | Cookies (IDs + quantities only) | All prices, stock and shipping are computed server-side on every request |
| Admin | `/admin` (password + signed session cookie) | Products, orders, leads, fitment approvals, AI knowledge, redirects; audit-logged |

### Key directories

```
src/lib/            core domain: search, fitment, cart, orders, payfast, shipping, ai/
src/app/            routes (storefront, admin, api)
src/components/     shared UI (product card, listing, assistant widget…)
prisma/             schema, migrations, seed + seed data
scripts/            crawler + importers (see "Catalogue migration")
tests/              vitest unit + integration suites
reports/            crawl report, data-quality report, redirect map, source manifest
```

## Local setup

Requirements: Node 20+, PostgreSQL 14+.

```bash
npm install
cp .env.example .env            # then fill in values (see below)
createdb aam                    # or point DATABASE_URL at an existing DB
npx prisma migrate dev          # create schema
npx prisma db seed              # load the sample catalogue + articles + knowledge
npm run dev                     # http://localhost:3000
```

Admin: `http://localhost:3000/admin` — password is `ADMIN_PASSWORD` from `.env`.

## Environment variables

See `.env.example` for the full annotated list. Summary:

- `DATABASE_URL` — Postgres connection string
- `NEXT_PUBLIC_SITE_URL` — public origin (used for PayFast return URLs, sitemap, JSON-LD)
- `ADMIN_PASSWORD`, `SESSION_SECRET` — admin auth
- `AI_PROVIDER` — `mock` (offline, deterministic; default) or `anthropic`
- `ANTHROPIC_API_KEY`, `AI_MODEL` — used when `AI_PROVIDER=anthropic` (default model `claude-opus-5`)
- `PAYFAST_MERCHANT_ID/KEY/PASSPHRASE`, `PAYFAST_SANDBOX` — PayFast; defaults are the public sandbox pair
- `COURIER_GUY_API_KEY/API_URL` — Shiplogic; leave the key empty to use flat-rate fallback quotes
- `WOO_BASE_URL/CONSUMER_KEY/CONSUMER_SECRET` — only for the WooCommerce API importer

## Catalogue migration (replacing the sample data)

Three repeatable paths — all normalise to the same JSON and feed one loader:

1. **WooCommerce CSV export (recommended)** — WooCommerce admin → Products → Export:
   ```bash
   npm run import:csv path/to/woo-export.csv
   npm run import:catalog data/import/products.normalized.json -- --replace-sample
   ```
2. **Authorised WooCommerce REST API** — set `WOO_*` env vars, then:
   ```bash
   npm run import:api
   npm run import:catalog data/import/products.normalized.json -- --replace-sample
   ```
3. **Polite crawler** (robots.txt-aware, rate-limited, public pages only) — run from a machine
   with normal internet access:
   ```bash
   npm run crawl                       # writes data/crawl/…
   npm run import:catalog data/crawl/products.normalized.json -- --replace-sample
   ```

Every import: dedupes by SKU/name, strips HTML, detects engine families for fitment hints,
writes a quality report + redirect map, upserts by slug (idempotent), and creates 301 redirect
rows for old `/product/...` URLs. `--replace-sample` archives leftover sample products.
Product images: the crawl writes `asset-manifest.json`; download those files into `public/products/`
(or a CDN) and re-run the importer, or keep the Woo CDN URLs in the export.

## Vehicle fitment

- Vehicles/engines live in `VehicleMake`/`VehicleModel`/`EngineFamily`; customers save theirs in **My Garage** (cookie).
- `Fitment` rows link products to applications with status `CONFIRMED`, `UNIVERSAL_WITH_REQUIREMENTS`, `POTENTIAL`, or `NOT_COMPATIBLE`.
- Evaluation rules (`src/lib/fitment.ts`): explicit NOT_COMPATIBLE always wins; absence of data is **never** shown as a confirmed fit; unapproved records are invisible.
- **Adding verified records:** Admin → Fitment approvals → "Add verified fitment record", or bulk-insert `Fitment` rows with `source=STAFF, approved=true`.
- **AI suggestions:** anything created with `source=AI_SUGGESTED` lands in the approval queue with `approved=false` and cannot surface to customers until staff approve it.

## AI specialist

- Chat widget on every page; grounded in the live catalogue via tools (`search_products`, `get_product`, `check_fitment`, `review_basket`, `search_knowledge`).
- **Grounding guard** (`src/lib/ai/grounding.ts`): the model must reference products as `[product:slug]`; tokens are resolved server-side against the DB *and* against the set of slugs actually returned by tools this conversation — fabricated or injected products are stripped before display. Prices shown always come from the DB.
- **Basket safety:** the model can only *propose* additions; the customer confirms in the UI before anything is added.
- **Leads:** `create_project_brief` requires explicit consent + contact details, else it refuses.
- **Escalation:** low confidence / safety-critical → `escalate_to_human` with a conversation summary and phone/WhatsApp/email handoff.
- **Knowledge ingestion:** Admin → AI knowledge (only *approved* chunks are retrievable). Articles seeded from `prisma/seed-data.ts` are pre-approved. To move to vector retrieval, implement `retrieveKnowledge()` against pgvector using the existing `KnowledgeChunk.embedding` column.
- **Monitoring quality:** every assistant turn writes an `AuditLog` row (`assistant.turn`) recording tools called, products shown, proposals and escalations — review in Admin → Dashboard. Prompt-injection defence: tool results are treated as data (system prompt directive) + the grounding guard blocks non-tool-surfaced slugs.

## Payments & delivery

- **PayFast:** `/api/checkout` re-prices the cart server-side, creates the order (`AWAITING_PAYMENT`), and returns signed sandbox form fields; the browser auto-posts to PayFast. `/api/payfast/itn` verifies signature → merchant → amount (against the stored order, never the payload) → server postback, then marks the order `PAID` and decrements stock atomically. Switch to production by setting `PAYFAST_SANDBOX=false` + real credentials + passphrase.
- **The Courier Guy:** set `COURIER_GUY_API_KEY` for live Shiplogic rates; without it the flat-rate fallback applies (R149 main centres / R199 regional, +R50 per 5 kg over 5 kg, free over R2,500 under 30 kg — tune in `src/lib/shipping.ts`).

## Testing

```bash
npm test          # 60 tests: unit + integration
```

- Unit: fitment logic, PayFast signatures/ITN verification, search aliases, cart cookie parsing, price helpers, shipping rules, importer normalisation/dedupe.
- Integration (needs seeded DB): faceted search, server-side cart validation, AI grounding guard (fabricated + injected slugs), AI tool permissions (proposal gating, consent, fitment honesty), mock-provider end-to-end.

Manual smoke: `npm run build && npm start`, then walk / → garage → shop?fit=vehicle → PDP → basket → checkout (PayFast sandbox card page) → `/checkout/result`.

## Deployment

Any Node host with Postgres (Vercel + Neon/Supabase, Fly.io, a VPS):

1. Provision Postgres; set all env vars (strong `ADMIN_PASSWORD`/`SESSION_SECRET`, real `NEXT_PUBLIC_SITE_URL`).
2. `npx prisma migrate deploy`
3. Import the real catalogue (above), then seed only articles/knowledge if desired.
4. `npm run build && npm start` (or platform equivalent).
5. Point PayFast ITN at `https://<domain>/api/payfast/itn` and test a sandbox payment end-to-end.
6. Keep old-URL SEO: redirects are served from the DB (`/admin/redirects` + importer-generated).

Security headers + CSP are in `next.config.ts`; rate limiting is in-memory (swap `src/lib/rate-limit.ts` for Redis when scaling horizontally). Error-monitoring hook points: wrap `console.error` call sites in `src/app/api/*` with your Sentry/OTel client.

## Updating catalogue data

- Day-to-day price/stock edits: Admin → Products.
- Bulk refresh: re-run any importer — upserts are idempotent by slug and preserve manually-added fitment records and relations.
- The search index rebuilds automatically (60 s TTL) or immediately after admin edits.

## Known limitations & next steps

1. **Sample catalogue** — real data must be imported (see above); prices/stock/policies/hours are placeholders flagged in the UI and reports.
2. **Product photography** — placeholder SVGs until asset migration.
3. **Reviews** — placeholder messaging on the homepage; needs a source of verified reviews.
4. **Email notifications** — order confirmation/status emails not yet wired (hook in `markOrderPaid` and `/api/leads`).
5. **Vector RAG** — keyword retrieval is in place; pgvector upgrade is a single-module swap.
6. **Product comparison** — deferred; facet/fitment filtering covers the primary comparison need.
7. **Analytics** — consent-aware analytics hooks not yet added (recommend a cookieless provider or a consent banner + GA4).
8. **Rate limiting/state** — in-memory; use Redis for multi-instance deployments.
9. **Courier Guy** — request/response shapes for Shiplogic are implemented from public docs but untested without a key; flat-rate fallback covers outages by design.
10. **Woo variation products** — the CSV importer collapses variations into their parent; per-variation SKUs need a follow-up if the store uses them heavily.

## Reports

- `reports/crawl-report.md` — why the live crawl couldn't run here + how to run it
- `reports/data-quality-report.md` — current data caveats and pre-launch checklist
- `reports/redirect-map.csv` — old → new URL mapping (DB-served, pattern fallbacks included)
- `reports/source-manifest.json` — attribution for all public information used
