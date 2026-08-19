import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Shop by Vehicle",
  description: "Find parts for your classic Ford, Chevrolet, Dodge, Plymouth or Pontiac — Mustang, Camaro, Corvette, Charger, C10 and more.",
  alternates: { canonical: "/vehicles" },
};

// Makes with a logo file in public/makes/<slug>.webp (shown on a light chip).
const MAKE_LOGOS = new Set(["ford", "chevrolet", "dodge", "plymouth"]);

export default async function VehiclesPage() {
  const [makes, engines] = await Promise.all([
    prisma.vehicleMake.findMany({ orderBy: { name: "asc" }, include: { models: { orderBy: { name: "asc" } } } }),
    prisma.engineFamily.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="headline text-3xl text-paper-50">Shop by Vehicle</h1>
      <div className="rule-red mt-2" />
      <p className="mt-3 max-w-3xl text-steel-300">
        Pick your platform, or{" "}
        <Link href="/garage" className="font-semibold text-race-500 hover:underline">save your vehicle in My Garage</Link>{" "}
        so every product page shows whether it fits.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {makes.map((make) => (
          <section key={make.slug} className="rounded-lg border border-ink-800 bg-ink-900 p-5">
            <h2 className="flex items-center gap-3">
              {MAKE_LOGOS.has(make.slug) && (
                <span className="inline-flex items-center rounded bg-paper-50 px-2.5 py-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/makes/${make.slug}.webp`} alt="" className="h-7 w-auto" />
                </span>
              )}
              <span className="headline text-xl text-paper-50">{make.name}</span>
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {make.models.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/garage?add=${make.slug}:${m.slug}`}
                    className="flex justify-between rounded px-2 py-1.5 text-steel-300 hover:bg-ink-800 hover:text-white"
                  >
                    <span>{m.name}</span>
                    <span className="text-steel-400">{m.yearFrom}–{m.yearTo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <h2 className="headline mt-12 text-2xl text-paper-50">Shop by Engine Family</h2>
      <div className="rule-red mt-2" />
      <ul className="mt-6 flex flex-wrap gap-2">
        {engines.map((e) => (
          <li key={e.slug}>
            <Link href={`/engines/${e.slug}`} className="block rounded-full border border-ink-700 px-4 py-2 text-sm font-semibold text-paper-100 hover:border-race-600">
              {e.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
