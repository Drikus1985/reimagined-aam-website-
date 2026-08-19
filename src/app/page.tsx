import Link from "next/link";
import { prisma } from "@/lib/db";
import { productCardInclude } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { AskAiButton } from "@/components/ask-ai-button";
import { HeroVehiclePicker } from "@/components/hero-vehicle-picker";
import { BrandLogoChip } from "@/components/logo";
import { businessInfo } from "../../prisma/seed-data";

export const revalidate = 300;

export default async function HomePage() {
  const [featured, bestSellers, inStock, categories, articles, productCount, topBrands, brandCount] = await Promise.all([
    prisma.product.findMany({ where: { status: "ACTIVE", isFeatured: true }, include: productCardInclude, take: 4, orderBy: { popularity: "desc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", isBestSeller: true }, include: productCardInclude, take: 4, orderBy: { popularity: "desc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", stockStatus: "IN_STOCK" }, include: productCardInclude, take: 4, orderBy: { popularity: "desc" } }),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { position: "asc" }, include: { _count: { select: { products: true } } } }),
    prisma.article.findMany({ orderBy: { publishedAt: "desc" }, take: 3 }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.brand.findMany({
      orderBy: { products: { _count: "desc" } },
      take: 2,
      include: { _count: { select: { products: true } } },
    }),
    prisma.brand.count(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="blueprint border-b border-ink-800 bg-ink-900">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-race-500">Alberton, South Africa · American muscle specialists</p>
            <h1 className="headline mt-3 text-4xl leading-tight text-paper-50 sm:text-5xl lg:text-6xl">
              American muscle.<br />Real parts. Real fitment.<br />
              <span className="text-race-500">Delivered nationwide.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-steel-300">
              {productCount} performance parts for classic Ford, Chevrolet, Dodge and Mopar — backed by the workshop
              that restores and builds these cars every day.
            </p>
            <div className="mt-8 flex flex-wrap gap-10">
              <div>
                <p className="headline text-3xl text-brass-400">{productCount}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-steel-400">Parts in catalogue</p>
              </div>
              <div>
                <p className="headline text-3xl text-brass-400">{brandCount}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-steel-400">US brands stocked</p>
              </div>
              <div>
                <p className="headline text-3xl text-brass-400">2 000 m²</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-steel-400">Alberton workshop</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="rounded border border-ink-600 px-6 py-3 font-bold uppercase tracking-wide text-paper-100 hover:border-race-600">
                Browse all parts
              </Link>
              <AskAiButton prompt="I'd like help choosing parts. Ask me about my vehicle and what I'm building." label="Ask the AI specialist" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <HeroVehiclePicker />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="headline text-2xl text-paper-50">Shop by category</h2>
        <div className="rule-red mt-2" />
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} className="block rounded-lg border border-ink-800 bg-ink-900 p-4 transition-colors hover:border-race-600">
                <p className="font-semibold leading-snug text-paper-50">{c.name}</p>
                <p className="mt-1 text-xs text-steel-400">{c._count.products} products</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Brands strip */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-ink-800 bg-ink-900 px-5 py-4 sm:gap-5">
          <p className="text-xs font-bold uppercase tracking-wider text-brass-400">Brands we stock</p>
          {topBrands.map((b) => (
            <Link key={b.slug} href={`/brand/${b.slug}`} className="hover:opacity-90">
              {b.logoUrl ? (
                <BrandLogoChip src={b.logoUrl} name={b.name} />
              ) : (
                <span className="headline block rounded border border-ink-700 px-4 py-1.5 text-base tracking-[0.14em] text-paper-50 hover:border-race-600">
                  {b.name.toUpperCase()}
                </span>
              )}
            </Link>
          ))}
          <p className="text-sm text-steel-400">+ {Math.max(brandCount - topBrands.length, 0)} more American performance brands</p>
          <Link href="/brands" className="ml-auto text-sm font-semibold uppercase tracking-wide text-race-500 hover:underline">
            All brands →
          </Link>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-baseline justify-between">
            <h2 className="headline text-2xl text-paper-50">Featured parts</h2>
            <Link href="/shop" className="text-sm font-semibold text-race-500 hover:underline">View all →</Link>
          </div>
          <div className="rule-red mt-2" />
          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}

      {/* Services band */}
      <section className="border-y border-ink-800 bg-ink-900">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-3">
          {[
            {
              href: "/services/restorations", title: "Restorations",
              text: "Frame-off restorations of classic American iron, done properly in our 2000 m² Alberton facility.",
            },
            {
              href: "/services/engine-building", title: "Engine building",
              text: "From stock rebuilds to serious street/strip power — machined, balanced, assembled and run-in in-house.",
            },
            {
              href: "/dream-builds", title: "Dream builds",
              text: "Start from a brand-new licensed Dynacorn body shell and build the car you've always wanted.",
            },
          ].map((s) => (
            <Link key={s.href} href={s.href} className="group rounded-lg border border-ink-700 bg-ink-950/60 p-6 transition-colors hover:border-race-600">
              <h3 className="headline text-xl text-paper-50 group-hover:text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-300">{s.text}</p>
              <p className="mt-3 text-sm font-bold text-race-500">Learn more →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Best sellers + in stock */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="headline text-2xl text-paper-50">Workshop favourites</h2>
          <div className="rule-red mt-2" />
          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {bestSellers.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}
      {inStock.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-4 pb-10">
          <div className="flex items-baseline justify-between">
            <h2 className="headline text-2xl text-paper-50">In stock &amp; ready to ship</h2>
            <Link href="/shop?stock=in" className="text-sm font-semibold text-race-500 hover:underline">View all →</Link>
          </div>
          <div className="rule-red mt-2" />
          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {inStock.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}

      {/* Trust / contact band */}
      <section className="border-t border-ink-800 bg-ink-900">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-2">
          <div>
            <h2 className="headline text-2xl text-paper-50">Why buy from the workshop?</h2>
            <div className="rule-red mt-2" />
            <ul className="mt-4 space-y-3 text-steel-300">
              <li><strong className="text-paper-50">We fit what we sell.</strong> Every part in this catalogue is one our technicians have worked with on real restorations and builds.</li>
              <li><strong className="text-paper-50">Honest fitment.</strong> If our data doesn't confirm a fit, the site says so — and we verify it for you before you pay.</li>
              <li><strong className="text-paper-50">US supplier network.</strong> Can't find it? We source and import hard-to-find parts quickly and cost-effectively.</li>
              <li><strong className="text-paper-50">Real people.</strong> Call {businessInfo.phone} or WhatsApp {businessInfo.whatsapp} — Ford, Chev and Mopar specialists, not a call centre.</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={businessInfo.whatsappLink} target="_blank" rel="noopener noreferrer" className="rounded bg-emerald-700 px-5 py-2.5 font-bold text-white hover:bg-emerald-600">
                WhatsApp a specialist
              </a>
              <Link href="/contact" className="rounded border border-ink-600 px-5 py-2.5 font-semibold text-paper-100 hover:border-race-600">
                Contact &amp; hours
              </Link>
            </div>
            <p className="mt-6 text-xs text-steel-400">
              Customer reviews coming soon — we're collecting verified reviews from workshop clients and online orders.
            </p>
          </div>
          <div>
            <h2 className="headline text-2xl text-paper-50">From the tech desk</h2>
            <div className="rule-red mt-2" />
            <ul className="mt-4 space-y-4">
              {articles.map((a) => (
                <li key={a.slug} className="rounded-lg border border-ink-800 bg-ink-950/60 p-4">
                  <Link href={`/articles/${a.slug}`} className="font-semibold text-paper-50 hover:underline">{a.title}</Link>
                  <p className="mt-1 text-sm text-steel-400">{a.excerpt}</p>
                </li>
              ))}
            </ul>
            <Link href="/articles" className="mt-4 inline-block text-sm font-semibold text-race-500 hover:underline">All technical articles →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
