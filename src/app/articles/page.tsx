import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Technical Articles",
  description: "Practical technical guidance from the All American Muscle workshop — carburettor sizing, engine identification, brake upgrades, cooling and more.",
  alternates: { canonical: "/articles" },
};

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="headline text-3xl text-paper-50">Technical Articles</h1>
      <div className="rule-red mt-2" />
      <p className="mt-3 text-steel-300">Written by people who build these cars, for people who drive them.</p>
      <ul className="mt-8 space-y-4">
        {articles.map((a) => (
          <li key={a.slug} className="rounded-lg border border-ink-800 bg-ink-900 p-5 transition-colors hover:border-ink-600">
            {a.category && <p className="text-xs font-bold uppercase tracking-wide text-race-500">{a.category}</p>}
            <h2 className="mt-1 text-xl font-bold text-paper-50">
              <Link href={`/articles/${a.slug}`} className="hover:underline">{a.title}</Link>
            </h2>
            <p className="mt-2 text-sm text-steel-300">{a.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
