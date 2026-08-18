#!/usr/bin/env bash
# All American Muscle — one-shot production data load + smoke test.
#
# Run from the repo root on any machine with internet access:
#
#   bash scripts/go-live.sh
#
# It will ask for two things and do the rest:
#   1. the DIRECT Supabase connection string (port 5432) — typed hidden,
#      used only inside this terminal session, never written to disk
#   2. your Vercel preview URL — to run the 19-check smoke test at the end
#
# Safe to re-run: every step is idempotent (imports match by slug/SKU,
# the seed refuses politely if data already exists).

set -u

step() { printf "\n\033[1m==> %s\033[0m\n" "$1"; }
ok()   { printf "\033[32m    done\033[0m\n"; }
die()  { printf "\033[31mFAILED: %s\033[0m\n" "$1"; exit 1; }

[ -f package.json ] || die "run this from the repo folder (cd into it first)"
command -v node >/dev/null || die "Node.js is not installed — install from nodejs.org (LTS) and re-run"

step "Installing dependencies (first run takes a few minutes)"
npm install --no-audit --no-fund || die "npm install"
ok

if [ -z "${DATABASE_URL:-}" ]; then
  printf "\nPaste the DIRECT Supabase connection string (Settings > Database > port 5432)\nInput is hidden — paste and press Enter: "
  read -rs DATABASE_URL || die "no input"
  echo
  export DATABASE_URL
fi
case "$DATABASE_URL" in
  *:6543*) die "that's the POOLER string (6543). This script needs the DIRECT one (5432); the pooler string goes in Vercel." ;;
  postgres*) : ;;
  *) die "that doesn't look like a postgres connection string" ;;
esac

step "Applying database schema"
npx prisma migrate deploy || die "migrate"
ok

step "Seeding reference data (articles, vehicles, engine families)"
npx prisma db seed || echo "    (seed skipped — data already present, that's fine)"

step "Importing the 723-product live catalogue"
npm run import:aam reports/handover/aam_site_catalogue_20260811.csv || die "catalogue normalize"
npx tsx scripts/import-catalog.ts data/import/products.normalized.json --replace-sample || die "catalogue load"
ok

step "Applying approved master pricing (655 rows)"
npm run import:prices data/price-overrides.csv || die "price import"
ok

step "Finalising catalogue (merchandising defaults, review flags)"
npx tsx scripts/finalize-live-catalog.ts reports/handover/site_skus_not_in_master.csv || die "finalize"
ok

step "Attaching the 65 supplier product photos"
npx tsx scripts/attach-product-images.ts data/supplier-images || die "photo attach"
ok

step "Migrating the 644 existing product photos off the old site (10-15 min)"
npx tsx scripts/fetch-product-images.ts || echo "    (some downloads may have failed — reports/image-migration-report.md has the list; re-run this script to retry)"

step "Fetching the confirmed brand images from the web"
node scripts/fetch-web-images.mjs || echo "    (some fetches failed — they can be retried later)"
npx tsx scripts/attach-product-images.ts data/supplier-images || true
ok

if ! git diff --quiet -- public/products/live data/supplier-images 2>/dev/null; then
  step "Committing downloaded photos so Vercel serves them"
  git add public/products/live data/supplier-images reports/image-migration-report.md 2>/dev/null
  git commit -m "Add migrated product photos for production" || true
  git push || echo "    (push failed — run 'git push' manually; photos won't show on the site until pushed)"
  ok
fi

printf "\nSmoke test — paste your Vercel preview URL (e.g. https://something.vercel.app)\nor press Enter to skip: "
read -r PREVIEW_URL || PREVIEW_URL=""
if [ -n "$PREVIEW_URL" ]; then
  node scripts/smoke-test.mjs "$PREVIEW_URL"
else
  echo "Skipped. Run later with: node scripts/smoke-test.mjs <preview-url>"
fi

printf "\n\033[1mData load complete.\033[0m Next: sandbox PayFast payment on the preview, then production credentials + DNS (docs/DEPLOYMENT.md sections 3-4).\n"
