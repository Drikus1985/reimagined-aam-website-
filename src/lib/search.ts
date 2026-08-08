import MiniSearch from "minisearch";
import { prisma } from "./db";
import { expandQuery } from "./aliases";

/**
 * Faceted catalogue search built on MiniSearch (in-process, fuzzy, typo
 * tolerant). Abstracted behind searchCatalog() so a hosted engine
 * (Meilisearch/Typesense) can be swapped in without touching callers.
 */

export type SearchDoc = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  brand: string;
  brandSlug: string;
  categories: string[]; // slugs
  categoryNames: string[];
  engineFamilies: string[]; // slugs
  engineNames: string[];
  aliases: string; // engine aliases text
  description: string;
  priceCents: number;
  stockStatus: string;
  popularity: number;
  createdAt: number;
};

export type SearchFilters = {
  category?: string;
  brand?: string;
  engineFamily?: string;
  inStockOnly?: boolean;
  minPriceCents?: number;
  maxPriceCents?: number;
};

export type SortKey = "relevance" | "popularity" | "price-asc" | "price-desc" | "newest";

export type FacetCounts = {
  categories: Record<string, number>;
  brands: Record<string, number>;
  engineFamilies: Record<string, number>;
  stock: Record<string, number>;
};

let index: MiniSearch<SearchDoc> | null = null;
let docs: Map<string, SearchDoc> = new Map();
let builtAt = 0;
const TTL_MS = 60_000;

async function buildIndex(): Promise<void> {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      brand: true,
      categories: { include: { category: true } },
      engineFamilies: { include: { engineFamily: true } },
    },
  });

  const newDocs = new Map<string, SearchDoc>();
  for (const p of products) {
    const engineAliases = p.engineFamilies
      .flatMap((e) => (Array.isArray(e.engineFamily.aliases) ? (e.engineFamily.aliases as string[]) : []))
      .join(" ");
    newDocs.set(p.id, {
      id: p.id,
      slug: p.slug,
      name: p.name,
      sku: p.sku ?? "",
      brand: p.brand?.name ?? "",
      brandSlug: p.brand?.slug ?? "",
      categories: p.categories.map((c) => c.category.slug),
      categoryNames: p.categories.map((c) => c.category.name),
      engineFamilies: p.engineFamilies.map((e) => e.engineFamily.slug),
      engineNames: p.engineFamilies.map((e) => e.engineFamily.name),
      aliases: engineAliases,
      description: (p.shortDescription ?? "").slice(0, 500),
      priceCents:
        p.salePriceCents != null && p.salePriceCents > 0 && p.salePriceCents < p.regularPriceCents
          ? p.salePriceCents
          : p.regularPriceCents,
      stockStatus: p.stockStatus,
      popularity: p.popularity,
      createdAt: p.createdAt.getTime(),
    });
  }

  const mini = new MiniSearch<SearchDoc>({
    fields: ["name", "sku", "brand", "categoryNames", "engineNames", "aliases", "description"],
    storeFields: ["id"],
    searchOptions: {
      boost: { name: 3, sku: 4, brand: 2, engineNames: 2, aliases: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
    extractField: (doc, field) => {
      const v = (doc as unknown as Record<string, unknown>)[field];
      return Array.isArray(v) ? v.join(" ") : (v as string);
    },
  });
  mini.addAll([...newDocs.values()]);

  index = mini;
  docs = newDocs;
  builtAt = Date.now();
}

export async function ensureIndex(force = false): Promise<void> {
  if (force || !index || Date.now() - builtAt > TTL_MS) {
    await buildIndex();
  }
}

/** Invalidate after admin catalogue mutations. */
export function invalidateSearchIndex(): void {
  builtAt = 0;
}

function applyFilters(list: SearchDoc[], f: SearchFilters): SearchDoc[] {
  return list.filter((d) => {
    if (f.category && !d.categories.includes(f.category)) return false;
    if (f.brand && d.brandSlug !== f.brand) return false;
    if (f.engineFamily && !d.engineFamilies.includes(f.engineFamily)) return false;
    if (f.inStockOnly && d.stockStatus !== "IN_STOCK") return false;
    if (f.minPriceCents != null && d.priceCents < f.minPriceCents) return false;
    if (f.maxPriceCents != null && d.priceCents > f.maxPriceCents) return false;
    return true;
  });
}

function computeFacets(list: SearchDoc[]): FacetCounts {
  const facets: FacetCounts = { categories: {}, brands: {}, engineFamilies: {}, stock: {} };
  for (const d of list) {
    for (const c of d.categories) facets.categories[c] = (facets.categories[c] ?? 0) + 1;
    if (d.brandSlug) facets.brands[d.brandSlug] = (facets.brands[d.brandSlug] ?? 0) + 1;
    for (const e of d.engineFamilies) facets.engineFamilies[e] = (facets.engineFamilies[e] ?? 0) + 1;
    facets.stock[d.stockStatus] = (facets.stock[d.stockStatus] ?? 0) + 1;
  }
  return facets;
}

function sortDocs(list: SearchDoc[], sort: SortKey, relevance?: Map<string, number>): SearchDoc[] {
  const copy = [...list];
  switch (sort) {
    case "popularity":
      return copy.sort((a, b) => b.popularity - a.popularity);
    case "price-asc":
      return copy.sort((a, b) => a.priceCents - b.priceCents);
    case "price-desc":
      return copy.sort((a, b) => b.priceCents - a.priceCents);
    case "newest":
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    case "relevance":
    default:
      if (relevance) {
        return copy.sort((a, b) => (relevance.get(b.id) ?? 0) - (relevance.get(a.id) ?? 0));
      }
      return copy.sort((a, b) => b.popularity - a.popularity);
  }
}

export type SearchResult = {
  ids: string[];
  total: number;
  facets: FacetCounts;
};

export async function searchCatalog(opts: {
  query?: string;
  filters?: SearchFilters;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}): Promise<SearchResult> {
  await ensureIndex();
  const { query, filters = {}, sort = "relevance", page = 1, perPage = 24 } = opts;

  let candidates: SearchDoc[];
  let relevance: Map<string, number> | undefined;

  if (query && query.trim()) {
    const expanded = expandQuery(query.trim());
    const hits = index!.search(expanded);
    relevance = new Map(hits.map((h) => [h.id as string, h.score]));
    candidates = hits.map((h) => docs.get(h.id as string)).filter((d): d is SearchDoc => !!d);
  } else {
    candidates = [...docs.values()];
  }

  // Facets are computed on the query result before hard filters, per facet
  // dimension excluding its own filter, simplified: compute on filtered-except-self.
  const filtered = applyFilters(candidates, filters);
  const facets = computeFacets(applyFilters(candidates, { ...filters, category: undefined, brand: undefined, engineFamily: undefined }));

  const sorted = sortDocs(filtered, sort, relevance);
  const start = (page - 1) * perPage;
  return {
    ids: sorted.slice(start, start + perPage).map((d) => d.id),
    total: sorted.length,
    facets,
  };
}
