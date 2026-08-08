import Link from "next/link";
import { CartBadge, GarageBadge, SearchBox } from "./header-client";

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
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-baseline gap-1" aria-label="All American Muscle — home">
          <span className="headline text-xl text-paper-50 sm:text-2xl">ALL AMERICAN</span>
          <span className="headline text-xl text-race-500 sm:text-2xl">MUSCLE</span>
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
