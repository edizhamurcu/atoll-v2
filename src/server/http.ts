import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { BookingError } from "./booking";
import { rateLimit } from "@/lib/redis";
import { db } from "@/lib/db";

export const json = (data: unknown, init?: number | ResponseInit) =>
  NextResponse.json(data, typeof init === "number" ? { status: init } : init);

export const problem = (status: number, code: string, message: string, details?: unknown) =>
  NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });

/** nginx sets X-Real-IP from CF-Connecting-IP (real_ip module); never trust X-Forwarded-For blindly. */
export function clientIp(req: Request) {
  return req.headers.get("x-real-ip") ?? req.headers.get("cf-connecting-ip") ?? "unknown";
}

export async function limit(req: Request, bucket: string, max: number, windowSec: number) {
  const ok = await rateLimit(`${bucket}:${clientIp(req)}`, max, windowSec);
  return ok ? null : problem(429, "RATE_LIMITED", "Too many requests, slow down");
}

export function parse<T>(schema: ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

export function handleError(e: unknown) {
  if (e instanceof ZodError) return problem(422, "VALIDATION", "Invalid request", e.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  if (e instanceof BookingError) return problem(e.status, e.code, e.message);
  if (e instanceof SyntaxError) return problem(400, "BAD_JSON", "Body must be valid JSON");
  console.error("[api] unhandled", e instanceof Error ? e.message : e);
  return problem(500, "INTERNAL", "Something went wrong. Please try again.");
}

export async function readJson(req: Request, maxBytes = 32_768) {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new BookingError("PAYLOAD_TOO_LARGE", "Request body too large", 413);
  const text = await req.text();
  if (text.length > maxBytes) throw new BookingError("PAYLOAD_TOO_LARGE", "Request body too large", 413);
  return JSON.parse(text || "{}");
}

/** Partner API: `Authorization: Bearer atl_<key>`; only the sha256 is stored. */
export async function requireApiKey(req: Request, scope: string) {
  const auth = req.headers.get("authorization") ?? "";
  const key = auth.startsWith("Bearer atl_") ? auth.slice(7) : null;
  if (!key) return { error: problem(401, "UNAUTHORIZED", "API key required") };
  const row = await db.apiKey.findUnique({ where: { keyHash: createHash("sha256").update(key).digest("hex") } });
  if (!row || !row.active) return { error: problem(401, "UNAUTHORIZED", "Invalid API key") };
  if (!row.scopes.includes(scope) && !row.scopes.includes("*")) return { error: problem(403, "FORBIDDEN", `Missing scope ${scope}`) };
  db.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { key: row };
}
