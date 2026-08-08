import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Vehicle picker data: makes, models (with year ranges) and engine families. */
export async function GET() {
  const [makes, engines] = await Promise.all([
    prisma.vehicleMake.findMany({
      orderBy: { name: "asc" },
      include: { models: { orderBy: { name: "asc" } } },
    }),
    prisma.engineFamily.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json(
    {
      makes: makes.map((m) => ({
        slug: m.slug,
        name: m.name,
        models: m.models.map((mod) => ({
          slug: mod.slug,
          name: mod.name,
          yearFrom: mod.yearFrom,
          yearTo: mod.yearTo,
        })),
      })),
      engines: engines.map((e) => ({ slug: e.slug, name: e.name, make: e.make })),
    },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } },
  );
}
