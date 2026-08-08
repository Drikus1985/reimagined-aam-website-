import { prisma } from "@/lib/db";
import { formatZar } from "@/lib/money";
import { updateProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const products = await prisma.product.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : undefined,
    orderBy: [{ needsReview: "desc" }, { name: "asc" }],
    include: { brand: true },
    take: 100,
  });

  return (
    <div>
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search name or SKU…" className="w-72 rounded border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-50" />
        <button className="rounded bg-ink-700 px-4 py-2 text-sm font-semibold text-paper-100 hover:bg-ink-600">Filter</button>
      </form>
      <p className="mb-3 text-xs text-steel-400">
        Products flagged “review” are SAMPLE seed data or imports needing verification — replace via the importer before launch.
      </p>
      <div className="overflow-x-auto rounded-lg border border-ink-800">
        <table className="w-full min-w-200 text-sm">
          <thead className="bg-ink-900 text-left text-xs uppercase tracking-wide text-steel-400">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Price (R)</th>
              <th className="px-3 py-2">Stock qty</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Review</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {products.map((p) => (
              <tr key={p.id} className="bg-ink-950/50 align-middle">
                <td className="px-3 py-2">
                  <p className="font-semibold text-paper-50">{p.name}</p>
                  <p className="text-xs text-steel-400">{p.brand?.name} · {p.sku} · {p.sourceType}{p.needsReview ? " · ⚠ needs review" : ""}</p>
                </td>
                <td className="px-3 py-2" colSpan={4}>
                  <form action={updateProduct} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input name="price" defaultValue={(p.regularPriceCents / 100).toFixed(2)} className="w-24 rounded border border-ink-700 bg-ink-900 px-2 py-1 text-paper-50" aria-label={`Price for ${p.name}`} />
                    <input name="stockQty" type="number" min="0" defaultValue={p.stockQty ?? 0} className="w-20 rounded border border-ink-700 bg-ink-900 px-2 py-1 text-paper-50" aria-label={`Stock for ${p.name}`} />
                    <select name="stockStatus" defaultValue={p.stockStatus} className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-paper-50" aria-label={`Stock status for ${p.name}`}>
                      {["IN_STOCK", "OUT_OF_STOCK", "BACKORDER", "PREORDER"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-steel-300">
                      <input type="checkbox" name="needsReview" defaultChecked={p.needsReview} /> review
                    </label>
                    <button className="rounded bg-race-600 px-3 py-1 text-xs font-bold text-white hover:bg-race-700">Save</button>
                    <span className="text-xs text-steel-400">current: {formatZar(p.regularPriceCents)}</span>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
