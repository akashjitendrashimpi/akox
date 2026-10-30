/**
 * In-memory sliding-window rate limiter for serverless / edge runtime.
 * Provides defense-in-depth against API floods, credential stuffing, and bot hammering.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const cache = new Map<string, RateLimitRecord>();

// Periodically clean up stale entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of cache.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300_000);
      if (record.timestamps.length === 0) {
        cache.delete(key);
      }
    }
  }, 300_000);
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const record = cache.get(identifier) ?? { timestamps: [] };

  // Remove timestamps outside window
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0] ?? now;
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return { ok: false, remaining: 0, resetMs };
  }

  validTimestamps.push(now);
  cache.set(identifier, { timestamps: validTimestamps });

  return {
    ok: true,
    remaining: limit - validTimestamps.length,
    resetMs: windowMs,
  };
}

/** Extracts client IP address safely from standard proxy headers */
export function getClientIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0];
    if (first) return first.trim();
  }

  return '127.0.0.1';
}

