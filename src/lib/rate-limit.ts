/**
 * Simple in-memory sliding window rate limiter for server actions.
 * Good enough for a single Vercel serverless instance; swap for Upstash
 * Redis if you need cross-instance limits.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    throw new Error("Too many requests. Please slow down.");
  }
  hits.push(now);
  buckets.set(key, hits);
}
