import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { prisma } from "@/lib/db";
import { getActiveVehicle } from "@/lib/garage";
import { verdictForProduct } from "@/lib/catalog";
import { effectivePriceCents, formatZar, isOnSale } from "@/lib/money";
import { FitmentBadge } from "@/components/fitment-badge";
import { AddToCartButton } from "@/components/add-to-cart";
import { AskAiButton } from "@/components/ask-ai-button";
import { ProductCard } from "@/components/product-card";
import { productCardInclude } from "@/lib/catalog";
import { describeVehicle } from "@/lib/fitment";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true }, take: 200 });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.product.findUnique({ where: { slug }, include: { images: { take: 1 } } });
  if (!p) return {};
  return {
    title: p.seoTitle?.replace(" | All American Muscle", "") ?? p.name,
    description: p.seoDescription ?? p.shortDescription ?? undefined,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: p.name,
      description: p.shortDescription ?? undefined,
      images: p.images[0]?.url ? [{ url: p.images[0].url }] : undefined,
    },
  };
}

const REL_TITLES: Record<string, string> = {
  REQUIRED: "Required with this part",
  RECOMMENDED: "Recommended upgrades",
  FREQUENTLY_BOUGHT_TOGETHER: "Frequently bought together",
  CROSS_SELL: "Goes well with",
  UPSELL: "Step up to",
  RELATED: "Related products",
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      images: { orderBy: { position: "asc" } },
      categories: { include: { category: { include: { parent: true } } } },
      engineFamilies: { include: { engineFamily: true } },
      fitments: { where: { approved: true }, include: { make: true, model: true, engineFamily: true } },
      relationsFrom: { include: { related: { include: productCardInclude } } },
    },
  });
  if (!product || product.status !== "ACTIVE") notFound();

  const vehicle = await getActiveVehicle();
  const verdict = await verdictForProduct(product.id, vehicle);
  const price = effectivePriceCents(product);
  const sale = isOnSale(product);
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";
  const specs = (product.specs as { label: string; value: string }[] | null) ?? [];
  const included = (product.included as string[] | null) ?? [];
  const required = (product.requiredParts as string[] | null) ?? [];
  const primaryCategory = product.categories[0]?.category;

  const needsVerification =
    product.requiresFitmentCheck && verdict.status !== "CONFIRMED" && verdict.status !== "UNIVERSAL";

  const relationGroups = new Map<string, typeof product.relationsFrom>();
  for (const rel of product.relationsFrom) {
    const group = relationGroups.get(rel.type) ?? [];
    group.push(rel);
    relationGroups.set(rel.type, group);
  }

  const articles = await prisma.article.findMany({ orderBy: { publishedAt: "desc" }, take: 2 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    description: product.shortDescription ?? undefined,
    image: product.images.map((i) => `${siteUrl}${i.url}`),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "ZAR",
      price: (price / 100).toFixed(2),
      availability:
        product.stockStatus === "IN_STOCK"
          ? "https://schema.org/InStock"
          : product.stockStatus === "BACKORDER"
            ? "https://schema.org/BackOrder"
            : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${siteUrl}/shop` },
      ...(primaryCategory ? [{ "@type": "ListItem", position: 2, name: primaryCategory.name, item: `${siteUrl}/category/${primaryCategory.slug}` }] : []),
      { "@type": "ListItem", position: primaryCategory ? 3 : 2, name: product.name, item: `${siteUrl}/products/${product.slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-steel-400">
        <Link href="/shop" className="hover:text-white">Shop</Link>
        {primaryCategory && (
          <> / <Link href={`/category/${primaryCategory.slug}`} className="hover:text-white">{primaryCategory.name}</Link></>
        )}
        {" / "}<span className="text-paper-100">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-ink-800 bg-ink-850">
            <ProductImage
              src={product.images[0]?.url ?? "/products/engines-components.svg"}
              alt={product.images[0]?.alt ?? product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <ul className="mt-3 flex gap-2">
              {product.images.slice(1, 5).map((img) => (
                <li key={img.id} className="relative h-20 w-20 overflow-hidden rounded border border-ink-800">
                  <ProductImage src={img.url} alt={img.alt ?? ""} fill sizes="80px" className="object-cover" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Buy box */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-steel-400">
            {product.brand && (
              <Link href={`/brand/${product.brand.slug}`} className="hover:text-white">{product.brand.name}</Link>
            )}
            {product.sku && <span className="ml-2 font-normal normal-case text-steel-400">SKU {product.sku}</span>}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-paper-50 lg:text-3xl">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-paper-50">{formatZar(price)}</span>
            {sale && <span className="text-lg text-steel-400 line-through">{formatZar(product.regularPriceCents)}</span>}
            <span className="text-sm text-steel-400">incl. VAT</span>
          </div>

          <p className="mt-2 text-sm">
            {product.stockStatus === "IN_STOCK" && (
              <span className="font-semibold text-emerald-400">
                In stock{product.stockQty != null && product.stockQty <= 5 ? ` — only ${product.stockQty} left` : " and ready to ship"}
              </span>
            )}
            {product.stockStatus === "BACKORDER" && <span className="font-semibold text-amber-400">Backorder — imported to order from our US network</span>}
            {product.stockStatus === "OUT_OF_STOCK" && <span className="font-semibold text-race-500">Out of stock</span>}
          </p>

          {/* Fitment */}
          <div className="mt-4 rounded-lg border border-ink-700 bg-ink-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FitmentBadge verdict={verdict} />
              <Link href="/garage" className="text-xs font-semibold text-race-500 hover:underline">
                {vehicle ? `Checking against: ${describeVehicle(vehicle)}` : "Select your vehicle →"}
              </Link>
            </div>
            {verdict.detail && <p className="mt-2 text-sm text-steel-300">{verdict.detail}</p>}
            {product.safetyCritical && (
              <p className="mt-2 rounded bg-race-700/10 px-3 py-2 text-xs font-semibold text-race-500">
                Safety-critical component — professional installation or inspection strongly recommended.
              </p>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <AddToCartButton
              productId={product.id}
              disabled={outOfStock}
              requiresVerification={needsVerification}
              verificationWarning={verdict.detail ?? undefined}
            />
            <AskAiButton prompt={`Tell me about "${product.name}" (${product.slug}). Will it work for my vehicle, and what else do I need with it?`} />
            <a
              href={`https://wa.me/27720426477?text=${encodeURIComponent(`Hi! I'm looking at "${product.name}" (${product.sku ?? product.slug}) on your site.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded border border-ink-600 px-4 py-2.5 text-sm font-semibold text-paper-100 hover:border-emerald-600 hover:text-white"
            >
              WhatsApp a specialist about this part
            </a>
          </div>

          <ul className="mt-5 space-y-1.5 text-sm text-steel-300">
            <li>🚚 Nationwide delivery via The Courier Guy — quote at checkout, main centres typically 1–3 working days</li>
            <li>🏭 Free collection from our Alberton workshop</li>
            <li>🔒 Secure checkout with PayFast (cards, instant EFT)</li>
            <li>↩ 14-day returns on unused parts — <Link href="/policies/returns" className="text-race-500 hover:underline">policy</Link></li>
          </ul>

          {required.length > 0 && (
            <div className="mt-5 rounded-lg border border-amber-800 bg-amber-950/40 p-4">
              <h2 className="text-sm font-bold text-amber-300">You'll also need</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-200/90">
                {required.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="headline text-xl text-paper-50">Description</h2>
          <div className="rule-red mt-2" />
          <p className="mt-4 leading-relaxed text-paper-100">{product.description}</p>

          {product.installNotes && (
            <>
              <h2 className="headline mt-8 text-xl text-paper-50">Fitment &amp; installation notes</h2>
              <div className="rule-red mt-2" />
              <p className="mt-4 leading-relaxed text-paper-100">{product.installNotes}</p>
            </>
          )}

          {product.fitments.length > 0 && (
            <>
              <h2 className="headline mt-8 text-xl text-paper-50">Verified applications</h2>
              <div className="rule-red mt-2" />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-125 border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-steel-400">
                      <th className="py-2 pr-4">Application</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.fitments.map((f) => (
                      <tr key={f.id} className="border-b border-ink-800 align-top">
                        <td className="py-2 pr-4 text-paper-100">
                          {[f.make?.name, f.model?.name, f.yearFrom || f.yearTo ? `${f.yearFrom ?? ""}–${f.yearTo ?? ""}` : null, f.engineFamily?.name]
                            .filter(Boolean).join(" ") || "Universal"}
                        </td>
                        <td className="py-2 pr-4 text-steel-300">{f.status.replaceAll("_", " ").toLowerCase()}</td>
                        <td className="py-2 text-steel-300">{f.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {included.length > 0 && (
            <>
              <h2 className="headline mt-8 text-xl text-paper-50">What's in the box</h2>
              <div className="rule-red mt-2" />
              <ul className="mt-4 list-inside list-disc space-y-1 text-paper-100">
                {included.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </>
          )}

          <h2 className="headline mt-8 text-xl text-paper-50">Warranty &amp; returns</h2>
          <div className="rule-red mt-2" />
          <p className="mt-4 text-steel-300">
            Manufacturer warranty applies per brand terms. Unused parts in original packaging may be returned within 14 days
            (special-order and electrical items excluded). See our <Link href="/policies/returns" className="text-race-500 hover:underline">returns policy</Link>.
          </p>
        </section>

        <aside>
          {specs.length > 0 && (
            <section className="rounded-lg border border-ink-800 bg-ink-900 p-5">
              <h2 className="headline text-lg text-paper-50">Specifications</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {specs.map((s) => (
                  <div key={s.label} className="flex justify-between gap-4 border-b border-ink-800 pb-2">
                    <dt className="text-steel-400">{s.label}</dt>
                    <dd className="text-right font-semibold text-paper-100">{s.value}</dd>
                  </div>
                ))}
                {product.weightGrams && (
                  <div className="flex justify-between gap-4 pb-1">
                    <dt className="text-steel-400">Shipping weight</dt>
                    <dd className="font-semibold text-paper-100">{(product.weightGrams / 1000).toFixed(1)} kg</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
          {articles.length > 0 && (
            <section className="mt-6 rounded-lg border border-ink-800 bg-ink-900 p-5">
              <h2 className="headline text-lg text-paper-50">From the workshop</h2>
              <ul className="mt-3 space-y-3">
                {articles.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/articles/${a.slug}`} className="text-sm font-semibold text-paper-100 hover:text-white hover:underline">
                      {a.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-steel-400">{a.excerpt}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {/* Relations */}
      {[...relationGroups.entries()].map(([type, rels]) => (
        <section key={type} className="mt-12">
          <h2 className="headline text-xl text-paper-50">{REL_TITLES[type] ?? "Related products"}</h2>
          <div className="rule-red mt-2" />
          <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {rels.slice(0, 4).map((rel) => (
              <li key={rel.id}>
                <ProductCard product={rel.related} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </div>
  );
}
