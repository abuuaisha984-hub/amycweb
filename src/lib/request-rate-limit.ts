type Bucket = { count: number; resetAt: number }

const globalForLimits = globalThis as typeof globalThis & {
  amycRateLimitBuckets?: Map<string, Bucket>
  amycRateLimitOperations?: number
}
const buckets = globalForLimits.amycRateLimitBuckets ??= new Map<string, Bucket>()

/** Per-process abuse guard. Production deployments should also apply edge/WAF limits. */
export function consumeRequestLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  if ((globalForLimits.amycRateLimitOperations = (globalForLimits.amycRateLimitOperations || 0) + 1) % 256 === 0 || buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now || buckets.size > 10_000) buckets.delete(bucketKey)
      if (buckets.size <= 8_000) break
    }
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }
  bucket.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

export function requestAddress(headers: Headers) {
  const candidate = (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"
  ).trim()
  return candidate.length <= 80 ? candidate : "unknown"
}
