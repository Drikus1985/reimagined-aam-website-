import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductListing, ListingSearchParams } from "@/components/product-listing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ListingSearchParams> };

export async function generateStaticParams() {
  const engines = await prisma.engineFamily.findMany({ select: { slug: true } });
  return engines.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const engine = await prisma.engineFamily.findUnique({ where: { slug } });
  if (!engine) return {};
  return {
    title: `${engine.name} Parts`,
    description: `Performance and replacement parts for ${engine.name} engines — verified applications, live SA stock.`,
    alternates: { canonical: `/engines/${slug}` },
  };
}

export default async function EnginePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const engine = await prisma.engineFamily.findUnique({ where: { slug } });
  if (!engine) notFound();
  const aliases = Array.isArray(engine.aliases) ? (engine.aliases as string[]).join(", ") : "";

  return (
    <ProductListing
      title={`${engine.name} Parts`}
      intro={aliases ? `Also known as: ${aliases}.` : undefined}
      basePath={`/engines/${slug}`}
      searchParams={await searchParams}
      fixed={{ engineFamily: slug }}
    />
  );
}
