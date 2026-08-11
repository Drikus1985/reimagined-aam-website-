import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db";

/**
 * Catch-all for unmatched paths: serves the migrated-URL redirect map
 * (old WooCommerce URLs -> new routes) from the database, then 404s.
 */
export default async function LegacyCatchAll({ params }: { params: Promise<{ legacy: string[] }> }) {
  const { legacy } = await params;
  const path = `/${legacy.join("/")}`;

  const hit =
    (await prisma.redirect.findUnique({ where: { fromPath: path } })) ??
    (await prisma.redirect.findUnique({ where: { fromPath: `${path}/` } }));
  if (hit) permanentRedirect(hit.toPath);

  // Woo pattern fallbacks: /product/<slug>/ and /product-category/<slug>/
  if (legacy[0] === "product" && legacy[1]) {
    const product = await prisma.product.findUnique({ where: { slug: legacy[1] } });
    if (product) permanentRedirect(`/products/${product.slug}`);
  }
  if (legacy[0] === "product-category" && legacy[1]) {
    const cat = await prisma.category.findUnique({ where: { slug: legacy[1] } });
    if (cat) permanentRedirect(`/category/${cat.slug}`);
  }

  notFound();
}
