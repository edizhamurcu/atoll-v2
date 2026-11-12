import "server-only";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { readyRedis } from "@/lib/redis";

/**
 * Small "human check" for public forms: an addition the visitor answers. The token carries no answer, only
 * HMAC(issued-at, nonce, answer), so it can't be read off the token; it expires, must not be answered faster than
 * a person can, and each token works once (nonce in Redis). Stops scripts that post straight to the API.
 */
const MIN_MS = 3_000;
const MAX_MS = 2 * 60 * 60_000;

function secret() {
  return process.env.CHALLENGE_SECRET || createHash("sha256").update(`challenge:${process.env.DATABASE_URL ?? ""}`).digest("hex");
}
const sig = (iat: number, nonce: string, answer: number) => createHmac("sha256", secret()).update(`${iat}.${nonce}.${answer}`).digest("base64url");

export function issueChallenge(now = Date.now()) {
  const a = randomInt(2, 10), b = randomInt(1, 10);
  const nonce = randomBytes(9).toString("base64url");
  return { a, b, token: `${now}.${nonce}.${sig(now, nonce, a + b)}` };
}

export type ChallengeResult = "OK" | "MISSING" | "WRONG" | "TOO_FAST" | "EXPIRED" | "USED";

export async function verifyChallenge(token: unknown, answer: unknown, now = Date.now()): Promise<ChallengeResult> {
  if (typeof token !== "string" || answer === undefined || answer === null || answer === "") return "MISSING";
  const m = /^(\d{13})\.([\w-]{12})\.([\w-]{43})$/.exec(token);
  const n = Number(String(answer).trim());
  if (!m || !Number.isInteger(n) || n < 0 || n > 99) return "WRONG";
  const iat = Number(m[1]);
  const expected = Buffer.from(sig(iat, m[2], n)), got = Buffer.from(m[3]);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return "WRONG";
  if (now - iat < MIN_MS) return "TOO_FAST";
  if (now - iat > MAX_MS) return "EXPIRED";
  const r = await readyRedis(500);
  if (r) {
    try {
      if (!(await r.set(`chal:${m[2]}`, "1", "PX", MAX_MS, "NX"))) return "USED";
    } catch {}
  }
  return "OK";
}
