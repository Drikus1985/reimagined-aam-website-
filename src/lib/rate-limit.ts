/**
 * Simple in-memory sliding-window rate limiter. Suitable for a single-node
 * deployment; swap for a Redis-backed implementation when scaling out.
 */

type Bucket = { timestamps: number[] };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0 };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.timestamps.length };
}

/** Best-effort client key from request headers. */
export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || req.headers.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}

// Periodic cleanup to stop unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < 300_000);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}, 60_000).unref?.();
