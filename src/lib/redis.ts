import "server-only";
import Redis from "ioredis";

const g = globalThis as unknown as { redis?: Redis | null };

/** Redis is an accelerator (rate limits, short caches). The app must keep working if it is down. */
export function redis(): Redis | null {
  if (g.redis !== undefined) return g.redis;
  const url = process.env.REDIS_URL;
  if (!url) return (g.redis = null);
  const client = new Redis(url, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: false, connectTimeout: 2000 });
  client.on("error", () => {}); // degrade silently; callers fail open/closed explicitly
  return (g.redis = client);
}

/**
 * Returns a ready client, waiting briefly while the first connection is still being made
 * (right after start-up the client is "connecting", which used to look like Redis being down).
 */
export async function readyRedis(waitMs = 1000): Promise<Redis | null> {
  const r = redis();
  if (!r) return null;
  if (r.status === "ready") return r;
  if (r.status !== "connecting" && r.status !== "connect" && r.status !== "wait" && r.status !== "reconnecting") return null;
  return new Promise((resolve) => {
    const done = (v: Redis | null) => {
      clearTimeout(timer);
      r.off("ready", onReady);
      resolve(v);
    };
    const onReady = () => done(r);
    const timer = setTimeout(() => done(r.status === "ready" ? r : null), waitMs);
    r.once("ready", onReady);
  });
}

/** Fixed-window rate limit. Returns true if allowed. Fails open when Redis is unavailable. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const r = await readyRedis(500);
  if (!r) return true;
  try {
    const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
    const n = await r.incr(k);
    if (n === 1) await r.expire(k, windowSec + 1);
    return n <= limit;
  } catch {
    return true;
  }
}
