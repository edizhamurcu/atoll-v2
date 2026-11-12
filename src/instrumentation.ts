export async function register() {
  // Open the Redis connection at boot so rate limits are enforced from the first request.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.REDIS_URL) {
    const { redis } = await import("@/lib/redis");
    redis();
  }
}
