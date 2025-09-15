import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for local/dev if Upstash creds are missing
type MemoryEntry = { tokens: number; resetAt: number };
const memoryBuckets = new Map<string, MemoryEntry>();

export function getClientIp(req: Request): string {
  try {
    // NextRequest has headers
    const xf = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    if (xf) return xf;
    const xr = req.headers.get("x-real-ip");
    if (xr) return xr;
  } catch {}
  return "0.0.0.0";
}

export function createRateLimiter(opts: { name: string; limit: number; windowSec: number }) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const redis = new Redis({ url, token });
    const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowSec} s`), prefix: `rl:${opts.name}` });
    return {
      async check(key: string) {
        const { success, remaining, reset } = await ratelimit.limit(key);
        return { allowed: success, remaining, reset: reset ?? new Date(Date.now() + opts.windowSec * 1000) };
      },
    };
  }
  // Memory fallback (not for prod)
  return {
    async check(key: string) {
      const now = Date.now();
      const existing = memoryBuckets.get(key);
      if (!existing || existing.resetAt <= now) {
        memoryBuckets.set(key, { tokens: opts.limit - 1, resetAt: now + opts.windowSec * 1000 });
        return { allowed: true, remaining: opts.limit - 1, reset: new Date(now + opts.windowSec * 1000) };
      }
      if (existing.tokens > 0) {
        existing.tokens -= 1;
        return { allowed: true, remaining: existing.tokens, reset: new Date(existing.resetAt) };
      }
      return { allowed: false, remaining: 0, reset: new Date(existing.resetAt) };
    },
  };
}

