import { NextRequest, NextResponse } from "next/server";
import { searchCatalog, SortKey } from "@/lib/search";
import { getProductsByIds } from "@/lib/catalog";
import { effectivePriceCents } from "@/lib/money";
import { rateLimit, clientKey } from "@/lib/rate-limit";

/** Lightweight search endpoint used by the header autocomplete. */
export async function GET(req: NextRequest) {
  const limit = rateLimit(clientKey(req, "search"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const q = req.nextUrl.searchParams.get("q")?.slice(0, 200) ?? "";
  if (!q.trim()) return NextResponse.json({ products: [], total: 0 });

  const sort = (req.nextUrl.searchParams.get("sort") ?? "relevance") as SortKey;
  const result = await searchCatalog({ query: q, sort, perPage: 6 });
  const products = await getProductsByIds(result.ids);

  return NextResponse.json({
    total: result.total,
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      brand: p.brand?.name ?? null,
      priceCents: effectivePriceCents(p),
      stockStatus: p.stockStatus,
      imageUrl: p.images[0]?.url ?? null,
    })),
  });
}
