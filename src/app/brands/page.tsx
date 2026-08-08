import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Brands",
  description: "The brands we stock: Mastodon, Edelbrock, Holley, COMP Cams, ARP, Fel-Pro, MSD, AP Racing, Ford Racing, Speedmaster, Lokar, Moog and more.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="headline text-3xl text-paper-50">Brands</h1>
      <div className="rule-red mt-2" />
      <p className="mt-3 max-w-3xl text-steel-300">
        Trusted US performance brands plus Mastodon — our workshop-proven house range.
      </p>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {brands.map((b) => (
          <li key={b.slug}>
            <Link href={`/brand/${b.slug}`} className="block h-full rounded-lg border border-ink-800 bg-ink-900 p-5 transition-colors hover:border-race-600">
              <p className="headline text-lg text-paper-50">{b.name}</p>
              <p className="mt-1 text-xs text-steel-400">{b._count.products} product{b._count.products === 1 ? "" : "s"}</p>
              {b.description && <p className="mt-2 text-sm leading-snug text-steel-300">{b.description}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
