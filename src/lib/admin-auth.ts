import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "aam_admin";

function secret(): string {
  return process.env.SESSION_SECRET ?? "dev-secret";
}

export function adminToken(): string {
  return crypto.createHmac("sha256", secret()).update("aam-admin-session").digest("hex");
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = adminToken();
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
