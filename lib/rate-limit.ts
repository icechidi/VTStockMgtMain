// lib/rate-limit.ts
//
// Lightweight in-memory rate limiter for auth-sensitive routes
// (login, forgot-password, reset-password, change-password).
//
// NOTE: this is process-local. It's sufficient for a single-instance
// deployment (which matches this project's local Postgres / single Next.js
// server setup) but will NOT share state across multiple server instances
// or serverless invocations. If this app is ever deployed behind multiple
// instances, replace this with a shared store (Redis, Postgres table, etc).

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Periodically clear stale buckets so this map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}, 5 * 60 * 1000).unref?.()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check + consume one attempt for `key` within `windowMs`.
 * Returns { allowed: false } once `limit` attempts have been used in the window.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/** Best-effort client IP extraction behind proxies/load balancers. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}
