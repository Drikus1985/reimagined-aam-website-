import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"), 303);
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
