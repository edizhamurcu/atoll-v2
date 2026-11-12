import { connection } from "next/server";
import { db } from "@/lib/db";
import { readyRedis } from "@/lib/redis";

export async function GET() {
  await connection();
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  let redisOk = false;
  try {
    const r = await readyRedis(1500);
    redisOk = (await r?.ping()) === "PONG";
  } catch {}
  return Response.json({ ok: dbOk, db: dbOk, redis: redisOk }, { status: dbOk ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
