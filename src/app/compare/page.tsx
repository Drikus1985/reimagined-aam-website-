import { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { prisma } from "@/lib/db";
import { getActiveVehicle } from "@/lib/garage";
import { verdictsForProducts, productCardInclude } from "@/lib/catalog";
import { effectivePriceCents, formatZar } from "@/lib/money";
import { FitmentBadge } from "@/components/fitment-badge";
import { AddToCartButton } from "@/components/add-to-cart";

export const metadata: Metadata = { title: "Compare Products", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const slugs = (p ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

  const products = slugs.length
    ? await prisma.product.findMany({
        where: { slug: { in: slugs }, status: "ACTIVE" },
        include: { ...productCardInclude, images: { orderBy: { position: "asc" }, take: 1 } },
      })
    : [];
  const ordered = slugs
    .map((slug) => products.find((prod) => prod.slug === slug))
    .filter((prod): prod is (typeof products)[number] => Boolean(prod));

  const vehicle = await getActiveVehicle();
  const verdicts = await verdictsForProducts(ordered.map((prod) => prod.id), vehicle);

  // Union of spec labels across the compared products
  const specLabels: string[] = [];
  for (const prod of ordered) {
    for (const spec of (prod.specs as { label: string; value: string }[] | null) ?? []) {
      if (!specLabels.includes(spec.label)) specLabels.push(spec.label);
    }
  }
  const specValue = (prod: (typeof ordered)[number], label: string) =>
    ((prod.specs as { label: string; value: string }[] | null) ?? []).find((s) => s.label === label)?.value ?? "—";

  if (ordered.length < 2) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="headline text-3xl text-paper-50">Compare Products</h1>
        <p className="mt-4 text-steel-300">
          Pick two to four products using the “Compare” checkbox on any product card, then come back here.
        </p>
        <Link href="/shop" className="mt-6 inline-block rounded bg-race-600 px-6 py-2.5 font-bold text-white hover:bg-race-700">
          Browse parts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="headline text-3xl text-paper-50">Compare</h1>
      <div className="rule-red mt-2" />
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-175 border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-36 px-3 py-2 text-left align-bottom text-xs uppercase tracking-wide text-steel-400"></th>
              {ordered.map((prod) => (
                <th key={prod.id} className="px-3 py-2 text-left align-bottom">
                  <div className="relative mb-2 aspect-square w-full max-w-40 overflow-hidden rounded border border-ink-800 bg-ink-850">
                    <ProductImage src={prod.images[0]?.url ?? "/products/engines-components.svg"} alt={prod.images[0]?.alt ?? prod.name} fill sizes="160px" className="object-cover" />
                  </div>
                  <Link href={`/products/${prod.slug}`} className="font-semibold text-paper-50 hover:underline">
                    {prod.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            <tr>
              <th scope="row" className="px-3 py-3 text-left text-steel-400">Price</th>
              {ordered.map((prod) => (
                <td key={prod.id} className="px-3 py-3 text-lg font-bold text-paper-50">{formatZar(effectivePriceCents(prod))}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="px-3 py-3 text-left text-steel-400">Brand / SKU</th>
              {ordered.map((prod) => (
                <td key={prod.id} className="px-3 py-3 text-paper-100">{prod.brand?.name ?? "—"}{prod.sku ? ` · ${prod.sku}` : ""}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="px-3 py-3 text-left text-steel-400">Availability</th>
              {ordered.map((prod) => (
                <td key={prod.id} className="px-3 py-3 text-paper-100">
                  {prod.stockStatus === "IN_STOCK" ? "In stock" : prod.stockStatus === "BACKORDER" ? "Backorder" : "Out of stock"}
                </td>
              ))}
            </tr>
            {vehicle && (
              <tr>
                <th scope="row" className="px-3 py-3 text-left text-steel-400">Fits your vehicle</th>
                {ordered.map((prod) => {
                  const verdict = verdicts.get(prod.id);
                  return <td key={prod.id} className="px-3 py-3">{verdict ? <FitmentBadge verdict={verdict} small /> : "—"}</td>;
                })}
              </tr>
            )}
            {specLabels.map((label) => (
              <tr key={label}>
                <th scope="row" className="px-3 py-3 text-left text-steel-400">{label}</th>
                {ordered.map((prod) => (
                  <td key={prod.id} className="px-3 py-3 text-paper-100">{specValue(prod, label)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="px-3 py-3 text-left text-steel-400">Summary</th>
              {ordered.map((prod) => (
                <td key={prod.id} className="px-3 py-3 align-top text-steel-300">{prod.shortDescription}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="px-3 py-3"></th>
              {ordered.map((prod) => (
                <td key={prod.id} className="px-3 py-3">
                  <AddToCartButton productId={prod.id} disabled={prod.stockStatus === "OUT_OF_STOCK"} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
