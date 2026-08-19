import Link from "next/link";
import { CartBadge, GarageBadge, SearchBox } from "./header-client";
import { AamLogo } from "./logo";
import { businessInfo } from "../../prisma/seed-data";

const TRUST = [
  {
    label: "Verified fitment data",
    color: "text-emerald-400",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />,
  },
  {
    label: "PayFast secure checkout",
    color: "text-steel-300",
    icon: <path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />,
  },
  {
    label: "The Courier Guy — nationwide delivery",
    color: "text-steel-300",
    icon: <path d="M1 4h14v12H1zM15 9h4l3 3v4h-7V9zM5.5 19a1.5 1.5 0 1 0 0-.01M18.5 19a1.5 1.5 0 1 0 0-.01" />,
  },
  {
    label: "Alberton workshop · 2 000 m²",
    color: "text-brass-400",
    icon: <path d="M14.7 6.3a5 5 0 1 0-6.6 6.6L3 18v3h3l5.1-5.1a5 5 0 0 0 6.6-6.6l-3.2 3.2-2.8-2.8 3-3z" />,
  },
];

const NAV = [
  { href: "/shop", label: "Shop Parts" },
  { href: "/vehicles", label: "Shop by Vehicle" },
  { href: "/brands", label: "Brands" },
  { href: "/services/restorations", label: "Restorations" },
  { href: "/services/engine-building", label: "Engine Building" },
  { href: "/dream-builds", label: "Dream Builds" },
  { href: "/articles", label: "Tech Articles" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-race-600 focus:px-4 focus:py-2 focus:text-white">
        Skip to main content
      </a>
      <div className="hidden border-b border-ink-800 bg-ink-900 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-1.5">
          <ul className="flex items-center gap-7">
            {TRUST.map((t) => (
              <li key={t.label} className={`flex items-center gap-1.5 text-xs font-semibold ${t.color}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{t.icon}</svg>
                {t.label}
              </li>
            ))}
          </ul>
          <a
            href={businessInfo.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z" />
            </svg>
            WhatsApp a specialist
          </a>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0" aria-label="All American Muscle — home">
          <AamLogo />
        </Link>
        <div className="hidden flex-1 md:block md:max-w-xl">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GarageBadge />
          <CartBadge />
        </div>
      </div>
      <div className="border-t border-ink-800 md:hidden">
        <div className="px-4 py-2">
          <SearchBox compact />
        </div>
      </div>
      <nav aria-label="Main navigation" className="border-t border-ink-800 bg-ink-900">
        <ul className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 text-sm">
          {NAV.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} className="block px-3 py-2.5 font-semibold text-paper-100 hover:bg-ink-800 hover:text-white">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
