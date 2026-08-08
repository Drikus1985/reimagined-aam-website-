import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { EnquiryForm } from "@/components/enquiry-form";

export const metadata: Metadata = {
  title: "Dream Builds",
  description: "Start from a brand-new licensed Dynacorn body shell and build the muscle car you've always wanted — no rust, no filler, no compromises.",
  alternates: { canonical: "/dream-builds" },
};

export default async function DreamBuildsPage() {
  const shell = await prisma.product.findFirst({
    where: { slug: "dynacorn-mustang-fastback-body-shell-67-68" },
    include: { images: { take: 1 } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-widest text-race-500">The ultimate starting point</p>
      <h1 className="headline mt-2 text-4xl text-paper-50">Dream Builds</h1>
      <div className="rule-red mt-3" />
      <p className="mt-4 max-w-3xl text-lg text-steel-300">
        Some cars are too far gone — and some dreams deserve better than fighting forty years of rust. A dream build
        starts with a brand-new, fully licensed reproduction body shell, built to original factory specification with
        modern manufacturing quality, and becomes exactly the car you want: numbers-correct restoration feel or a
        thoroughly modern restomod underneath.
      </p>

      <div className="mt-8 rounded-lg border border-ink-800 bg-ink-900 p-6">
        <h2 className="headline text-xl text-paper-50">1967–68 Mustang Fastback shell — available to order</h2>
        <p className="mt-2 text-sm leading-relaxed text-steel-300">
          Fully licensed Dynacorn reproduction of the most iconic fastback ever made. Accepts 1967–68 running gear
          and trim. Lead times apply; we'll walk you through options and budget before anything is ordered.
        </p>
        {shell && (
          <Link href={`/products/${shell.slug}`} className="mt-4 inline-block rounded bg-race-600 px-5 py-2.5 font-bold text-white hover:bg-race-700">
            View the body shell
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Plan", "We scope the build together — era-correct or restomod, driveline, brakes, interior, paint — with a phased budget."],
          ["Build", "Our restoration and engine teams execute in-house, with progress updates and photos at every stage."],
          ["Drive", "You get a documented, sorted, brand-new classic. The car you'd never find, because it never existed until now."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg border border-ink-800 bg-ink-900 p-5">
            <h2 className="headline text-lg text-race-500">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-steel-300">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <EnquiryForm type="DREAM_BUILD" heading="Start your dream build" />
      </div>
    </div>
  );
}
