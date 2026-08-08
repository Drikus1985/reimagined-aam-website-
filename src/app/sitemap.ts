import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [products, categories, brands, engines, articles] = await Promise.all([
    prisma.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true } }),
    prisma.brand.findMany({ select: { slug: true } }),
    prisma.engineFamily.findMany({ select: { slug: true } }),
    prisma.article.findMany({ select: { slug: true, publishedAt: true } }),
  ]);

  const statics = [
    "", "/shop", "/vehicles", "/brands", "/garage", "/about", "/contact",
    "/services/restorations", "/services/engine-building", "/dream-builds", "/articles",
    "/policies/terms", "/policies/privacy", "/policies/returns",
  ].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));

  return [
    ...statics,
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...brands.map((b) => ({ url: `${base}/brand/${b.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...engines.map((e) => ({ url: `${base}/engines/${e.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...articles.map((a) => ({ url: `${base}/articles/${a.slug}`, lastModified: a.publishedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
