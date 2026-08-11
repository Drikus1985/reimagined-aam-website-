import { prisma } from "./db";
import { evaluateFitment, FitmentVerdict, GarageVehicle } from "./fitment";
import { Prisma } from "@prisma/client";

export const productCardInclude = {
  brand: true,
  images: { orderBy: { position: "asc" as const }, take: 1 },
  categories: { include: { category: true } },
  engineFamilies: { include: { engineFamily: true } },
  fitments: { where: { approved: true } },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

/**
 * Evaluate fitment for a product against a garage vehicle, resolving fitment
 * record foreign keys via the maps supplied (built once per page).
 */
export async function verdictForProduct(
  productId: string,
  vehicle: GarageVehicle | null,
): Promise<FitmentVerdict> {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      engineFamilies: { include: { engineFamily: true } },
      fitments: {
        where: { approved: true },
        include: { make: true, model: true, engineFamily: true },
      },
    },
  });
  if (!p) return { status: "UNKNOWN", label: "Compatibility unknown" };
  return evaluateFitment(
    {
      universalFit: p.universalFit,
      requiresFitmentCheck: p.requiresFitmentCheck,
      engineFamilySlugs: p.engineFamilies.map((e) => e.engineFamily.slug),
    },
    p.fitments.map((f) => ({
      status: f.status,
      approved: f.approved,
      notes: f.notes,
      makeSlug: f.make?.slug ?? null,
      modelSlug: f.model?.slug ?? null,
      yearFrom: f.yearFrom,
      yearTo: f.yearTo,
      engineFamilySlug: f.engineFamily?.slug ?? null,
    })),
    vehicle,
  );
}

/** Batch fitment verdicts for product cards. */
export async function verdictsForProducts(
  productIds: string[],
  vehicle: GarageVehicle | null,
): Promise<Map<string, FitmentVerdict>> {
  const result = new Map<string, FitmentVerdict>();
  if (productIds.length === 0) return result;
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      engineFamilies: { include: { engineFamily: true } },
      fitments: {
        where: { approved: true },
        include: { make: true, model: true, engineFamily: true },
      },
    },
  });
  for (const p of products) {
    result.set(
      p.id,
      evaluateFitment(
        {
          universalFit: p.universalFit,
          requiresFitmentCheck: p.requiresFitmentCheck,
          engineFamilySlugs: p.engineFamilies.map((e) => e.engineFamily.slug),
        },
        p.fitments.map((f) => ({
          status: f.status,
          approved: f.approved,
          notes: f.notes,
          makeSlug: f.make?.slug ?? null,
          modelSlug: f.model?.slug ?? null,
          yearFrom: f.yearFrom,
          yearTo: f.yearTo,
          engineFamilySlug: f.engineFamily?.slug ?? null,
        })),
        vehicle,
      ),
    );
  }
  return result;
}

export async function getProductsByIds(ids: string[]): Promise<ProductCardData[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    include: productCardInclude,
  });
  const order = new Map(ids.map((id, i) => [id, i]));
  return rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
