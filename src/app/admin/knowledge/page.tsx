import { prisma } from "@/lib/db";
import { addKnowledge, toggleKnowledge } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminKnowledge() {
  const chunks = await prisma.knowledgeChunk.findMany({ orderBy: [{ approved: "asc" }, { createdAt: "desc" }] });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="headline text-lg text-paper-50">AI knowledge base</h2>
        <p className="mt-1 text-xs text-steel-400">
          The AI specialist can only retrieve <strong>approved</strong> chunks. Unapproved content is invisible to it.
        </p>
        <ul className="mt-4 space-y-2">
          {chunks.map((c) => (
            <li key={c.id} className="rounded-lg border border-ink-800 bg-ink-900 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <strong className="text-paper-50">{c.title}</strong>
                <span className="rounded bg-ink-800 px-2 py-0.5 text-xs text-steel-300">{c.sourceType}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${c.approved ? "bg-emerald-900 text-emerald-300" : "bg-amber-950 text-amber-300"}`}>
                  {c.approved ? "approved" : "pending"}
                </span>
                <form action={toggleKnowledge} className="ml-auto">
                  <input type="hidden" name="id" value={c.id} />
                  <button className="rounded border border-ink-600 px-3 py-1 text-xs font-semibold text-paper-100 hover:border-race-600">
                    {c.approved ? "Unapprove" : "Approve"}
                  </button>
                </form>
              </div>
              <p className="mt-2 line-clamp-3 text-steel-300">{c.content}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-ink-800 bg-ink-900 p-5">
        <h2 className="headline text-lg text-paper-50">Add workshop knowledge</h2>
        <form action={addKnowledge} className="mt-3 space-y-3">
          <input name="title" required placeholder="Title" className="w-full rounded border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-paper-50" />
          <textarea name="content" required rows={5} placeholder="Approved technical guidance, policies, or workshop facts…" className="w-full rounded border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-paper-50" />
          <button className="rounded bg-race-600 px-4 py-2 text-sm font-bold text-white hover:bg-race-700">Add (approved)</button>
        </form>
      </section>
    </div>
  );
}
