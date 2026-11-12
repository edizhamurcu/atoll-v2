import "server-only";
import { db } from "@/lib/db";

/**
 * Assistant configuration. Everything comes from the environment (server .env, never the client bundle);
 * the admin on/off switch lives in the Setting table (key "chat.enabled") and only works when CHAT_ENABLED=true.
 */
const num = (v: string | undefined, def: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== "" ? Math.min(max, Math.max(min, n)) : def;
};
const money = (v: string | undefined) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= 0 ? n : null;
};

export type ChatConfig = ReturnType<typeof chatConfig>;

export function chatConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    envEnabled: env.CHAT_ENABLED === "true",
    hasKey: Boolean(env.ANTHROPIC_API_KEY?.startsWith("sk-ant-")),
    model: env.ANTHROPIC_MODEL?.trim() || null,
    maxInputChars: num(env.CHAT_MAX_INPUT_LENGTH, 1000, 50, 4000),
    maxOutputTokens: num(env.CHAT_MAX_OUTPUT_TOKENS, 1000, 100, 4000),
    maxToolRounds: num(env.CHAT_MAX_TOOL_ROUNDS, 4, 1, 8),
    maxHistory: num(env.CHAT_MAX_HISTORY, 16, 2, 40),
    maxSessionMessages: num(env.CHAT_MAX_SESSION_MESSAGES, 40, 4, 200),
    timeoutMs: num(env.CHAT_TIMEOUT_MS, 30_000, 5_000, 120_000),
    dailyBudgetUsd: money(env.CHAT_DAILY_BUDGET_USD),
    monthlyBudgetUsd: money(env.CHAT_MONTHLY_BUDGET_USD),
    /** USD per million tokens for the configured model; cache write/read default to 1.25x / 0.1x of input. */
    price: {
      input: money(env.CHAT_PRICE_INPUT_PER_MTOK),
      output: money(env.CHAT_PRICE_OUTPUT_PER_MTOK),
      cacheWrite: money(env.CHAT_PRICE_CACHE_WRITE_PER_MTOK),
      cacheRead: money(env.CHAT_PRICE_CACHE_READ_PER_MTOK),
    },
    retentionDays: num(env.CHAT_RETENTION_DAYS, 90, 1, 3650),
    /** Staff mailbox for submitted requests (falls back to the site e-mail). */
    notifyEmail: env.CHAT_NOTIFY_EMAIL?.trim() || null,
  };
}

/** Why the assistant cannot answer right now (null = ready). Budgets and prices are mandatory: no budget, no spend. */
export function configProblem(c: ChatConfig): string | null {
  if (!c.envEnabled) return "ENV_DISABLED";
  if (!c.hasKey) return "NO_KEY";
  if (!c.model) return "NO_MODEL";
  if (c.price.input === null || c.price.output === null) return "NO_PRICES";
  if (c.dailyBudgetUsd === null || c.monthlyBudgetUsd === null) return "NO_BUDGET";
  return null;
}

export const SWITCH_KEY = "chat.enabled";

export async function adminSwitch(): Promise<boolean> {
  const row = await db.setting.findUnique({ where: { key: SWITCH_KEY } });
  return row ? row.value === true : false;
}

export async function setAdminSwitch(on: boolean) {
  await db.setting.upsert({ where: { key: SWITCH_KEY }, create: { key: SWITCH_KEY, value: on }, update: { value: on } });
}
