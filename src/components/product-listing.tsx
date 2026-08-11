import Link from "next/link";
import { prisma } from "@/lib/db";
import { searchCatalog, SortKey } from "@/lib/search";
import { getProductsByIds, verdictsForProducts } from "@/lib/catalog";
import { getActiveVehicle } from "@/lib/garage";
import { describeVehicle } from "@/lib/fitment";
import { ProductCard } from "./product-card";

export type ListingSearchParams = { [key: string]: string | string[] | undefined };

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

const PER_PAGE = 24;

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * Shared faceted product listing used by /shop, /category, /brand, /search and
 * engine-family pages. Filters are URL-parameter links (crawlable, no JS
 * needed); fitment filtering uses the active My Garage vehicle.
 */
export async function ProductListing({
  title,
  intro,
  basePath,
  searchParams,
  fixed = {},
}: {
  title: string;
  intro?: string;
  basePath: string;
  searchParams: ListingSearchParams;
  fixed?: { category?: string; brand?: string; engineFamily?: string };
}) {
  const q = str(searchParams.q);
  const category = fixed.category ?? str(searchParams.category);
  const brand = fixed.brand ?? str(searchParams.brand);
  const engineFamily = fixed.engineFamily ?? str(searchParams.engine);
  const inStockOnly = str(searchParams.stock) === "in";
  const sort = (str(searchParams.sort) as SortKey) ?? (q ? "relevance" : "popularity");
  const page = Math.max(1, parseInt(str(searchParams.page) ?? "1", 10) || 1);
  const fitFilter = str(searchParams.fit) === "vehicle";
  const minPrice = parseInt(str(searchParams.min) ?? "", 10);
  const maxPrice = parseInt(str(searchParams.max) ?? "", 10);

  const vehicle = await getActiveVehicle();

  // Fetch a wide window; fit-filtering happens after fitment evaluation.
  const result = await searchCatalog({
    query: q,
    filters: {
      category,
      brand,
      engineFamily,
      inStockOnly,
      minPriceCents: Number.isFinite(minPrice) ? minPrice * 100 : undefined,
      maxPriceCents: Number.isFinite(maxPrice) ? maxPrice * 100 : undefined,
    },
    sort,
    page: 1,
    perPage: 1000,
  });

  let ids = result.ids;
  const verdicts = await verdictsForProducts(ids, vehicle);
  if (fitFilter && vehicle) {
    ids = ids.filter((id) => {
      const v = verdicts.get(id);
      return v && (v.status === "CONFIRMED" || v.status === "UNIVERSAL");
    });
  }

  const total = ids.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const pageIds = ids.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const products = await getProductsByIds(pageIds);

  // Facet display data
  const [categories, brands, engines] = await Promise.all([
    prisma.category.findMany({ orderBy: { position: "asc" }, include: { parent: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.engineFamily.findMany({ orderBy: { name: "asc" } }),
  ]);
  const catName = new Map(categories.map((c) => [c.slug, c.name]));
  const brandName = new Map(brands.map((b) => [b.slug, b.name]));
  const engineName = new Map(engines.map((e) => [e.slug, e.name]));

  const currentParams = {
    q,
    category: fixed.category ? undefined : category,
    brand: fixed.brand ? undefined : brand,
    engine: fixed.engineFamily ? undefined : engineFamily,
    stock: inStockOnly ? "in" : undefined,
    sort: str(searchParams.sort),
    fit: fitFilter ? "vehicle" : undefined,
    min: str(searchParams.min),
    max: str(searchParams.max),
  };

  const activeFilters: { label: string; clear: Record<string, string | undefined> }[] = [];
  if (!fixed.category && category) activeFilters.push({ label: catName.get(category) ?? category, clear: { ...currentParams, category: undefined } });
  if (!fixed.brand && brand) activeFilters.push({ label: brandName.get(brand) ?? brand, clear: { ...currentParams, brand: undefined } });
  if (!fixed.engineFamily && engineFamily) activeFilters.push({ label: engineName.get(engineFamily) ?? engineFamily, clear: { ...currentParams, engine: undefined } });
  if (inStockOnly) activeFilters.push({ label: "In stock", clear: { ...currentParams, stock: undefined } });
  if (fitFilter) activeFilters.push({ label: `Fits ${vehicle ? describeVehicle(vehicle) : "my vehicle"}`, clear: { ...currentParams, fit: undefined } });

  const facetLink = (patch: Record<string, string | undefined>) =>
    `${basePath}${buildQuery({ ...currentParams, ...patch, page: undefined })}`;

  const facets = result.facets;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="headline text-3xl text-paper-50">{title}</h1>
        <div className="rule-red mt-2" />
        {intro && <p className="mt-3 max-w-3xl text-steel-300">{intro}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Filters" className="space-y-6">
          {vehicle ? (
            <div className="rounded-lg border border-ink-700 bg-ink-900 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-steel-400">My vehicle</p>
              <p className="mt-1 text-sm font-semibold text-paper-50">{describeVehicle(vehicle)}</p>
              <Link
                href={facetLink({ fit: fitFilter ? undefined : "vehicle" })}
                className={`mt-2 block rounded px-3 py-1.5 text-center text-sm font-semibold ${fitFilter ? "bg-race-600 text-white" : "border border-ink-600 text-paper-100 hover:border-race-600"}`}
              >
                {fitFilter ? "Showing parts that fit ✓" : "Only show parts that fit"}
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border border-ink-700 bg-ink-900 p-3">
              <p className="text-sm text-steel-300">
                <Link href="/garage" className="font-semibold text-race-500 hover:underline">Add your vehicle</Link>{" "}
                to see what fits.
              </p>
            </div>
          )}

          {activeFilters.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-steel-400">Active filters</h2>
              <ul className="mt-2 space-y-1">
                {activeFilters.map((f) => (
                  <li key={f.label}>
                    <Link href={`${basePath}${buildQuery({ ...f.clear, page: undefined })}`} className="inline-flex items-center gap-1 rounded bg-ink-800 px-2 py-1 text-xs text-paper-100 hover:bg-ink-700">
                      {f.label} <span aria-hidden="true">✕</span><span className="sr-only"> — remove filter</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={basePath} className="text-xs text-race-500 hover:underline">Clear all</Link>
                </li>
              </ul>
            </div>
          )}

          {!fixed.category && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-steel-400">Category</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {categories
                  .filter((c) => !c.parentId && (facets.categories[c.slug] ?? 0) > 0)
                  .map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={facetLink({ category: category === c.slug ? undefined : c.slug })}
                        className={`flex justify-between rounded px-2 py-1 hover:bg-ink-800 ${category === c.slug ? "bg-ink-800 font-semibold text-white" : "text-steel-300"}`}
                      >
                        <span>{c.name}</span>
                        <span className="text-steel-400">{facets.categories[c.slug]}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {!fixed.brand && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-steel-400">Brand</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {brands
                  .filter((b) => (facets.brands[b.slug] ?? 0) > 0)
                  .map((b) => (
                    <li key={b.slug}>
                      <Link
                        href={facetLink({ brand: brand === b.slug ? undefined : b.slug })}
                        className={`flex justify-between rounded px-2 py-1 hover:bg-ink-800 ${brand === b.slug ? "bg-ink-800 font-semibold text-white" : "text-steel-300"}`}
                      >
                        <span>{b.name}</span>
                        <span className="text-steel-400">{facets.brands[b.slug]}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {!fixed.engineFamily && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-steel-400">Engine family</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {engines
                  .filter((e) => (facets.engineFamilies[e.slug] ?? 0) > 0)
                  .map((e) => (
                    <li key={e.slug}>
                      <Link
                        href={facetLink({ engine: engineFamily === e.slug ? undefined : e.slug })}
                        className={`flex justify-between rounded px-2 py-1 hover:bg-ink-800 ${engineFamily === e.slug ? "bg-ink-800 font-semibold text-white" : "text-steel-300"}`}
                      >
                        <span>{e.name}</span>
                        <span className="text-steel-400">{facets.engineFamilies[e.slug]}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-steel-400">Availability</h2>
            <Link
              href={facetLink({ stock: inStockOnly ? undefined : "in" })}
              className={`mt-2 block rounded px-2 py-1 text-sm hover:bg-ink-800 ${inStockOnly ? "bg-ink-800 font-semibold text-white" : "text-steel-300"}`}
            >
              In stock &amp; ready to ship {inStockOnly ? "✓" : ""}
            </Link>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-steel-300" role="status">
              {total} product{total === 1 ? "" : "s"}
              {q ? <> for <strong className="text-paper-50">“{q}”</strong></> : null}
            </p>
            <nav aria-label="Sort products" className="flex flex-wrap gap-1 text-xs">
              {SORT_OPTIONS.map((o) => (
                <Link
                  key={o.value}
                  href={facetLink({ sort: o.value === "relevance" ? undefined : o.value })}
                  className={`rounded px-2.5 py-1.5 font-semibold ${sort === o.value ? "bg-race-600 text-white" : "border border-ink-700 text-steel-300 hover:border-ink-500"}`}
                  aria-current={sort === o.value ? "true" : undefined}
                >
                  {o.label}
                </Link>
              ))}
            </nav>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg border border-ink-800 bg-ink-900 p-10 text-center">
              <p className="text-lg font-semibold text-paper-50">No products match.</p>
              <p className="mt-2 text-steel-300">
                Try removing filters, or ask us — we source hard-to-find parts through our US supplier network.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link href={basePath} className="rounded border border-ink-600 px-4 py-2 text-sm font-semibold text-paper-100 hover:border-race-600">Clear filters</Link>
                <Link href="/contact" className="rounded bg-race-600 px-4 py-2 text-sm font-bold text-white hover:bg-race-700">Ask a specialist</Link>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4" aria-label="Products">
              {products.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} verdict={vehicle ? verdicts.get(p.id) : undefined} />
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2 text-sm">
              {page > 1 && (
                <Link href={`${basePath}${buildQuery({ ...currentParams, page: String(page - 1) })}`} className="rounded border border-ink-700 px-3 py-1.5 text-paper-100 hover:border-race-600" rel="prev">
                  ← Previous
                </Link>
              )}
              <span className="px-2 text-steel-300">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`${basePath}${buildQuery({ ...currentParams, page: String(page + 1) })}`} className="rounded border border-ink-700 px-3 py-1.5 text-paper-100 hover:border-race-600" rel="next">
                  Next →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
