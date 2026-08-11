import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductListing, ListingSearchParams } from "@/components/product-listing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ListingSearchParams> };

export async function generateStaticParams() {
  const cats = await prisma.category.findMany({ select: { slug: true } });
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) return {};
  return {
    title: `${cat.name} for American Muscle Cars`,
    description: cat.description ?? `Shop ${cat.name.toLowerCase()} for classic Ford, Chevrolet, Dodge and Mopar. Nationwide South African delivery from All American Muscle.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const cat = await prisma.category.findUnique({
    where: { slug },
    include: { children: true, parent: true },
  });
  if (!cat) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${process.env.NEXT_PUBLIC_SITE_URL}/shop` },
      ...(cat.parent
        ? [{ "@type": "ListItem", position: 2, name: cat.parent.name, item: `${process.env.NEXT_PUBLIC_SITE_URL}/category/${cat.parent.slug}` }]
        : []),
      { "@type": "ListItem", position: cat.parent ? 3 : 2, name: cat.name, item: `${process.env.NEXT_PUBLIC_SITE_URL}/category/${cat.slug}` },
    ],
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-steel-400">
          <Link href="/shop" className="hover:text-white">Shop</Link>
          {cat.parent && (
            <> / <Link href={`/category/${cat.parent.slug}`} className="hover:text-white">{cat.parent.name}</Link></>
          )}
          {" / "}<span className="text-paper-100">{cat.name}</span>
        </nav>
        {cat.children.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {cat.children.map((child) => (
              <li key={child.slug}>
                <Link href={`/category/${child.slug}`} className="rounded-full border border-ink-700 px-3 py-1.5 text-sm text-paper-100 hover:border-race-600">
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ProductListing
        title={cat.name}
        basePath={`/category/${slug}`}
        searchParams={await searchParams}
        fixed={{ category: slug }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </>
  );
}
