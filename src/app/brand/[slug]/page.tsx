import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductListing, ListingSearchParams } from "@/components/product-listing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ListingSearchParams> };

export async function generateStaticParams() {
  const brands = await prisma.brand.findMany({ select: { slug: true } });
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) return {};
  return {
    title: `${brand.name} Parts`,
    description: brand.description ?? `Shop genuine ${brand.name} parts for American muscle cars in South Africa.`,
    alternates: { canonical: `/brand/${slug}` },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) notFound();

  return (
    <ProductListing
      title={brand.name}
      intro={brand.description ?? undefined}
      basePath={`/brand/${slug}`}
      searchParams={await searchParams}
      fixed={{ brand: slug }}
    />
  );
}
