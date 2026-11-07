import { connection } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function GET() {
  await connection();
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  const r = redis();
  const redisOk = r?.status === "ready";
  return Response.json({ ok: dbOk, db: dbOk, redis: redisOk }, { status: dbOk ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
