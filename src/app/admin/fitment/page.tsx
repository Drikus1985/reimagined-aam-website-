import { prisma } from "@/lib/db";
import { approveFitment, rejectFitment, addFitment } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminFitment() {
  const [pending, makes, engines, products] = await Promise.all([
    prisma.fitment.findMany({
      where: { approved: false },
      include: { product: true, make: true, model: true, engineFamily: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.vehicleMake.findMany({ orderBy: { name: "asc" }, include: { models: true } }),
    prisma.engineFamily.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true }, take: 500 }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="headline text-lg text-paper-50">AI-suggested fitments awaiting approval</h2>
        <p className="mt-1 text-xs text-steel-400">
          AI suggestions never become customer-visible fitment data until a staff member approves them here.
        </p>
        {pending.length === 0 ? (
          <p className="mt-4 rounded border border-ink-800 bg-ink-900 p-4 text-sm text-steel-300">Queue is empty. 🎉</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {pending.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-800 bg-ink-900 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-paper-50">{f.product.name}</p>
                  <p className="text-steel-300">
                    {[f.make?.name, f.model?.name, f.yearFrom || f.yearTo ? `${f.yearFrom ?? ""}–${f.yearTo ?? ""}` : null, f.engineFamily?.name].filter(Boolean).join(" ") || "Universal"}
                    {" → "}<strong>{f.status}</strong> · source {f.source}
                  </p>
                  {f.notes && <p className="text-xs text-steel-400">{f.notes}</p>}
                </div>
                <form action={approveFitment}><input type="hidden" name="id" value={f.id} /><button className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600">Approve</button></form>
                <form action={rejectFitment}><input type="hidden" name="id" value={f.id} /><button className="rounded border border-race-700 px-3 py-1.5 text-xs font-bold text-race-500 hover:bg-race-700/10">Reject</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-ink-800 bg-ink-900 p-5">
        <h2 className="headline text-lg text-paper-50">Add verified fitment record</h2>
        <form action={addFitment} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm text-steel-300">Product
            <select name="productId" required className="mt-1 w-full rounded border border-ink-700 bg-ink-950 px-2 py-2 text-paper-50">
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="text-sm text-steel-300">Make (optional)
            <select name="make" className="mt-1 w-full rounded border border-ink-700 bg-ink-950 px-2 py-2 text-paper-50">
              <option value="">Any</option>
              {makes.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
            </select>
          </label>
          <label className="text-sm text-steel-300">Model slug (optional)
            <input name="model" placeholder="e.g. mustang-1964-1973" className="mt-1 w-full rounded border border-ink-700 bg-ink-950 px-2 py-2 text-paper-50" />
          </label>
          <label className="text-sm text-steel-300">Engine family (optional)
            <select name="engine" className="mt-1 w-full rounded border border-ink-700 bg-ink-950 px-2 py-2 text-paper-50">
              <option value="">Any</option>
              {engines.map((e) => <option key={e.slug} value={e.slug}>{e.name}</option>)}
            </select>
          </label>
          <label className="text-sm text-steel-300">Status
            <select name="status" className="mt-1 w-full rounded border border-ink-700 bg-ink-950 px-2 py-2 text-paper-50">
              {["CONFIRMED", "UNIVERSAL_WITH_REQUIREMENTS", "POTENTIAL", "NOT_COMPATIBLE"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-sm text-steel-300 lg:col-span-3">Notes
            <input name="notes" className="mt-1 w-full rounded border border-ink-700 bg-ink-950 px-2 py-2 text-paper-50" />
          </label>
          <div><button className="rounded bg-race-600 px-4 py-2 text-sm font-bold text-white hover:bg-race-700">Add record</button></div>
        </form>
      </section>
    </div>
  );
}
