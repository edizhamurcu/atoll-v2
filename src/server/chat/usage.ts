import "server-only";
import Decimal from "decimal.js";
import { db } from "@/lib/db";
import type { ChatConfig } from "./config";

export type Usage = { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null };

/** Cost in USD of one API response, from the per-MTok prices in the env (Decimal, no float drift). */
export function costOf(u: Usage, p: ChatConfig["price"]): Decimal {
  const input = new Decimal(p.input ?? 0), output = new Decimal(p.output ?? 0);
  const write = p.cacheWrite !== null ? new Decimal(p.cacheWrite) : input.mul(1.25);
  const read = p.cacheRead !== null ? new Decimal(p.cacheRead) : input.mul(0.1);
  return input.mul(u.input_tokens)
    .plus(output.mul(u.output_tokens))
    .plus(write.mul(u.cache_creation_input_tokens ?? 0))
    .plus(read.mul(u.cache_read_input_tokens ?? 0))
    .div(1_000_000);
}

const utcDay = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const monthStart = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));

export async function spend(now = new Date()) {
  const [day, month] = await Promise.all([
    db.chatUsage.findUnique({ where: { day: utcDay(now) } }),
    db.chatUsage.aggregate({ where: { day: { gte: monthStart(now) } }, _sum: { costUsd: true } }),
  ]);
  return { today: new Decimal(day?.costUsd?.toString() ?? 0), month: new Decimal(month._sum.costUsd?.toString() ?? 0) };
}

/**
 * Checked before every API call. The next call can cost at most the output cap plus a full prompt;
 * we stop when the remaining budget is below a worst-case estimate of one call, so a budget is never overshot by more than one call.
 */
export async function budgetLeft(c: ChatConfig, estimate: Decimal, now = new Date()): Promise<"OK" | "DAILY" | "MONTHLY"> {
  const s = await spend(now);
  if (c.monthlyBudgetUsd !== null && s.month.plus(estimate).gt(c.monthlyBudgetUsd)) return "MONTHLY";
  if (c.dailyBudgetUsd !== null && s.today.plus(estimate).gt(c.dailyBudgetUsd)) return "DAILY";
  return "OK";
}

/** Rough upper bound for one call: ~12k prompt tokens (system + tools + history) and the full output cap. */
export function callEstimate(c: ChatConfig): Decimal {
  return costOf({ input_tokens: 12_000, output_tokens: c.maxOutputTokens }, c.price);
}

export async function recordUsage(u: Usage, cost: Decimal, sessionId: string | null, now = new Date()) {
  const day = utcDay(now);
  const inc = {
    requests: { increment: 1 },
    inputTokens: { increment: u.input_tokens },
    outputTokens: { increment: u.output_tokens },
    cacheRead: { increment: u.cache_read_input_tokens ?? 0 },
    cacheWrite: { increment: u.cache_creation_input_tokens ?? 0 },
    costUsd: { increment: cost.toFixed(6) },
  };
  await db.chatUsage.upsert({
    where: { day },
    create: { day, requests: 1, inputTokens: u.input_tokens, outputTokens: u.output_tokens, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0, costUsd: cost.toFixed(6) },
    update: inc,
  });
  if (sessionId)
    await db.chatSession.update({
      where: { id: sessionId },
      data: { inputTokens: { increment: u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) }, outputTokens: { increment: u.output_tokens }, costUsd: { increment: cost.toFixed(6) } },
    });
}

export async function recordError(now = new Date()) {
  const day = utcDay(now);
  await db.chatUsage.upsert({ where: { day }, create: { day, errors: 1 }, update: { errors: { increment: 1 } } });
}
