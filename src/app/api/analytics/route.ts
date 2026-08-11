import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";

/**
 * First-party page-view counter. Stores ONLY (date, path, count) — no
 * visitor identifiers, IPs, or user agents. The client sends beacons only
 * after explicit consent.
 */
export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req, "analytics"), 60, 60_000);
  if (!limit.allowed) return new NextResponse(null, { status: 429 });

  const body = await req.json().catch(() => null);
  const rawPath = typeof body?.path === "string" ? body.path : "";
  if (!rawPath.startsWith("/") || rawPath.length > 200) return new NextResponse(null, { status: 400 });
  // Normalise away query strings and IDs we don't need.
  const path = rawPath.split("?")[0];
  if (path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });

  const today = new Date();
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  await prisma.pageViewDaily.upsert({
    where: { date_path: { date, path } },
    create: { date, path, count: 1 },
    update: { count: { increment: 1 } },
  });

  return new NextResponse(null, { status: 204 });
}
