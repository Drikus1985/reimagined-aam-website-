import { prisma } from "@/lib/db";
import { addRedirect, deleteRedirect } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminRedirects() {
  const redirects = await prisma.redirect.findMany({ orderBy: { fromPath: "asc" } });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-ink-800 bg-ink-900 p-5">
        <h2 className="headline text-lg text-paper-50">Add redirect (301)</h2>
        <form action={addRedirect} className="mt-3 flex flex-wrap gap-2">
          <input name="fromPath" required placeholder="/product/old-woocommerce-slug/" className="min-w-64 flex-1 rounded border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-paper-50" />
          <input name="toPath" required placeholder="/products/new-slug" className="min-w-64 flex-1 rounded border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-paper-50" />
          <button className="rounded bg-race-600 px-4 py-2 text-sm font-bold text-white hover:bg-race-700">Save</button>
        </form>
      </section>

      <div className="overflow-x-auto rounded-lg border border-ink-800">
        <table className="w-full text-sm">
          <thead className="bg-ink-900 text-left text-xs uppercase tracking-wide text-steel-400">
            <tr><th className="px-3 py-2">From</th><th className="px-3 py-2">To</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {redirects.map((r) => (
              <tr key={r.id} className="bg-ink-950/50">
                <td className="px-3 py-2 font-mono text-xs text-paper-100">{r.fromPath}</td>
                <td className="px-3 py-2 font-mono text-xs text-paper-100">{r.toPath}</td>
                <td className="px-3 py-2 text-right">
                  <form action={deleteRedirect}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-xs text-steel-400 hover:text-race-500">Delete</button>
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
