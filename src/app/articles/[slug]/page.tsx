import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AskAiButton } from "@/components/ask-ai-button";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({ select: { slug: true } });
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return {};
  return {
    title: article.seoTitle?.replace(" | All American Muscle", "") ?? article.title,
    description: article.seoDescription ?? article.excerpt ?? undefined,
    alternates: { canonical: `/articles/${slug}` },
    openGraph: { title: article.title, description: article.excerpt ?? undefined, type: "article" },
  };
}

/** Minimal, safe markdown rendering: headings, bold, lists, paragraphs. */
function renderMarkdown(md: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = escape(md).split("\n");
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;
  const closeList = () => { if (inList) { out.push(`</${inList}>`); inList = null; } };
  const inline = (s: string) =>
    s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
  for (const line of lines) {
    if (/^## /.test(line)) { closeList(); out.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (/^### /.test(line)) { closeList(); out.push(`<h3>${inline(line.slice(4))}</h3>`); }
    else if (/^- /.test(line)) { if (inList !== "ul") { closeList(); out.push("<ul>"); inList = "ul"; } out.push(`<li>${inline(line.slice(2))}</li>`); }
    else if (/^\d+\. /.test(line)) { if (inList !== "ol") { closeList(); out.push("<ol>"); inList = "ol"; } out.push(`<li>${inline(line.replace(/^\d+\. /, ""))}</li>`); }
    else if (line.trim() === "") { closeList(); }
    else { closeList(); out.push(`<p>${inline(line)}</p>`); }
  }
  closeList();
  return out.join("\n");
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    datePublished: article.publishedAt.toISOString(),
    author: { "@type": "Organization", name: "All American Muscle" },
    mainEntityOfPage: `${siteUrl}/articles/${article.slug}`,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-steel-400">
        <Link href="/articles" className="hover:text-white">Technical articles</Link> / <span className="text-paper-100">{article.title}</span>
      </nav>
      {article.category && <p className="mt-4 text-xs font-bold uppercase tracking-wide text-race-500">{article.category}</p>}
      <h1 className="mt-1 text-3xl font-bold leading-tight text-paper-50">{article.title}</h1>
      <div className="rule-red mt-3" />
      <div className="prose-dark mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }} />
      <div className="mt-10 rounded-lg border border-ink-800 bg-ink-900 p-5">
        <p className="text-sm text-steel-300">Questions about applying this to your car?</p>
        <div className="mt-3">
          <AskAiButton prompt={`I just read your article "${article.title}". I have questions about applying it to my vehicle.`} label="Ask the AI specialist" />
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
