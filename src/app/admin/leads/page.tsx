import { prisma } from "@/lib/db";
import { updateLeadStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLeads() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="space-y-3">
      {leads.length === 0 && <p className="rounded border border-ink-800 bg-ink-900 p-4 text-sm text-steel-300">No enquiries yet.</p>}
      {leads.map((lead) => (
        <details key={lead.id} className="rounded-lg border border-ink-800 bg-ink-900">
          <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="rounded bg-ink-800 px-2 py-0.5 text-xs font-bold text-steel-300">{lead.type}</span>
            <strong className="text-paper-50">{lead.name}</strong>
            <span className="text-steel-300">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</span>
            <span className={`ml-auto rounded px-2 py-0.5 text-xs font-bold ${lead.status === "NEW" ? "bg-race-700/20 text-race-500" : lead.status === "IN_PROGRESS" ? "bg-amber-950 text-amber-300" : "bg-ink-800 text-steel-300"}`}>
              {lead.status}
            </span>
          </summary>
          <div className="border-t border-ink-800 px-4 py-3 text-sm">
            {lead.vehicle && <p className="text-steel-300">Vehicle: <strong className="text-paper-100">{lead.vehicle}</strong></p>}
            <p className="mt-1 whitespace-pre-wrap text-paper-100">{lead.message}</p>
            {lead.brief != null && (
              <pre className="mt-2 overflow-x-auto rounded bg-ink-950 p-3 text-xs text-steel-300">{JSON.stringify(lead.brief, null, 2)}</pre>
            )}
            <p className="mt-2 text-xs text-steel-400">
              Source: {lead.source ?? "unknown"} · Consent: {lead.consent ? "yes" : "NO"} · {lead.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
            </p>
            <form action={updateLeadStatus} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="id" value={lead.id} />
              <select name="status" defaultValue={lead.status} className="rounded border border-ink-700 bg-ink-950 px-2 py-1.5 text-paper-50">
                {["NEW", "IN_PROGRESS", "CLOSED"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="rounded bg-race-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-race-700">Update</button>
            </form>
          </div>
        </details>
      ))}
    </div>
  );
}
