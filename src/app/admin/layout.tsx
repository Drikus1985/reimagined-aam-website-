import { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const NAV = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/fitment", "Fitment approvals"],
  ["/admin/orders", "Orders"],
  ["/admin/leads", "Enquiries & leads"],
  ["/admin/knowledge", "AI knowledge"],
  ["/admin/redirects", "Redirects"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  // avoid caching admin pages
  await headers();

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="headline text-2xl text-paper-50">Staff login</h1>
        <div className="rule-red mt-2" />
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="headline text-2xl text-paper-50">Admin</h1>
        <form action="/api/admin/logout" method="post">
          <button className="text-sm text-steel-400 hover:text-race-500">Log out</button>
        </form>
      </div>
      <nav aria-label="Admin sections" className="mt-4 flex flex-wrap gap-1 border-b border-ink-800 pb-3 text-sm">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className="rounded px-3 py-1.5 font-semibold text-steel-300 hover:bg-ink-800 hover:text-white">
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
