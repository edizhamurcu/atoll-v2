import "server-only";
import Redis from "ioredis";

const g = globalThis as unknown as { redis?: Redis | null };

/** Redis is an accelerator (rate limits, short caches). The app must keep working if it is down. */
export function redis(): Redis | null {
  if (g.redis !== undefined) return g.redis;
  const url = process.env.REDIS_URL;
  if (!url) return (g.redis = null);
  const client = new Redis(url, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: false });
  client.on("error", () => {}); // degrade silently; callers fail open/closed explicitly
  return (g.redis = client);
}

/** Fixed-window rate limit. Returns true if allowed. Fails open when Redis is unavailable. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const r = redis();
  if (!r || r.status !== "ready") return true;
  try {
    const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
    const n = await r.incr(k);
    if (n === 1) await r.expire(k, windowSec + 1);
    return n <= limit;
  } catch {
    return true;
  }
}
