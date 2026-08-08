import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, checkPassword } from "@/lib/admin-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req, "admin-login"), 5, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!checkPassword(password)) {
    await prisma.auditLog.create({ data: { actor: "admin", action: "admin.login_failed", meta: { ip: clientKey(req, "") } } });
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  await prisma.auditLog.create({ data: { actor: "admin", action: "admin.login" } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
