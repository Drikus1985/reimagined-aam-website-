import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, needsReview, orders, awaitingPayment, leads, newLeads, pendingFitments, knowledge, recentAudit] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { needsReview: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "AWAITING_PAYMENT" } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.fitment.count({ where: { approved: false } }),
      prisma.knowledgeChunk.count({ where: { approved: false } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    ]);

  const cards = [
    { href: "/admin/products", label: "Products", value: products, note: `${needsReview} flagged for review` },
    { href: "/admin/orders", label: "Orders", value: orders, note: `${awaitingPayment} awaiting payment` },
    { href: "/admin/leads", label: "Leads", value: leads, note: `${newLeads} new` },
    { href: "/admin/fitment", label: "Fitment approvals", value: pendingFitments, note: "AI suggestions awaiting staff review" },
    { href: "/admin/knowledge", label: "Knowledge pending", value: knowledge, note: "unapproved chunks" },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-lg border border-ink-800 bg-ink-900 p-4 hover:border-race-600">
            <p className="text-3xl font-bold text-paper-50">{c.value}</p>
            <p className="mt-1 font-semibold text-paper-100">{c.label}</p>
            <p className="text-xs text-steel-400">{c.note}</p>
          </Link>
        ))}
      </div>

      <h2 className="headline mt-8 text-lg text-paper-50">Recent activity (audit log)</h2>
      <ul className="mt-3 divide-y divide-ink-800 rounded-lg border border-ink-800 bg-ink-900 text-sm">
        {recentAudit.map((log) => (
          <li key={log.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
            <span className="text-paper-100">
              <strong className="text-paper-50">{log.actor}</strong> · {log.action}
              {log.entityId ? <span className="text-steel-400"> · {log.entity} {log.entityId.slice(0, 10)}…</span> : null}
            </span>
            <time className="text-steel-400">{log.createdAt.toISOString().replace("T", " ").slice(0, 19)} UTC</time>
          </li>
        ))}
      </ul>
    </div>
  );
}
