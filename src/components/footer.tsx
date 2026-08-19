import Link from "next/link";
import { businessInfo } from "../../prisma/seed-data";
import { AamLogo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-800 bg-ink-900">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p>
            <AamLogo small />
          </p>
          <p className="mt-3 text-sm leading-relaxed text-steel-300">
            American muscle car parts, restorations and engine builds from our 2000&nbsp;m² workshop in Alberton.
            Classic Ford, Chevrolet, Dodge and Mopar — and nothing else.
          </p>
          <p className="mt-3 text-sm text-steel-300">Nationwide delivery across South Africa.</p>
        </div>
        <nav aria-label="Shop links">
          <h2 className="headline text-sm text-paper-50">Shop</h2>
          <ul className="mt-3 space-y-2 text-sm text-steel-300">
            <li><Link className="hover:text-white" href="/shop">All parts</Link></li>
            <li><Link className="hover:text-white" href="/vehicles">Shop by vehicle</Link></li>
            <li><Link className="hover:text-white" href="/brands">Brands</Link></li>
            <li><Link className="hover:text-white" href="/garage">My Garage</Link></li>
            <li><Link className="hover:text-white" href="/basket">Basket</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company links">
          <h2 className="headline text-sm text-paper-50">Workshop</h2>
          <ul className="mt-3 space-y-2 text-sm text-steel-300">
            <li><Link className="hover:text-white" href="/services/restorations">Restorations</Link></li>
            <li><Link className="hover:text-white" href="/services/engine-building">Engine building</Link></li>
            <li><Link className="hover:text-white" href="/dream-builds">Dream builds</Link></li>
            <li><Link className="hover:text-white" href="/articles">Technical articles</Link></li>
            <li><Link className="hover:text-white" href="/about">About us</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="headline text-sm text-paper-50">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm text-steel-300">
            <li>{businessInfo.address}</li>
            <li><a className="hover:text-white" href={`tel:${businessInfo.phone.replace(/\s/g, "")}`}>{businessInfo.phone}</a></li>
            <li><a className="hover:text-white" href={businessInfo.whatsappLink} rel="noopener noreferrer" target="_blank">WhatsApp {businessInfo.whatsapp}</a></li>
            <li><a className="hover:text-white" href={`mailto:${businessInfo.email}`}>{businessInfo.email}</a></li>
            <li><a className="hover:text-white" href={businessInfo.facebook} rel="noopener noreferrer" target="_blank">Facebook</a></li>
            <li><a className="hover:text-white" href={businessInfo.tiktok} rel="noopener noreferrer" target="_blank">TikTok</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-steel-400">
          <p>© {new Date().getFullYear()} All American Muscle (Pty) Ltd. All rights reserved.</p>
          <ul className="flex flex-wrap gap-4">
            <li><Link className="hover:text-white" href="/policies/terms">Terms</Link></li>
            <li><Link className="hover:text-white" href="/policies/privacy">Privacy &amp; POPIA</Link></li>
            <li><Link className="hover:text-white" href="/policies/returns">Returns &amp; refunds</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
