import "server-only";
import type { Message, MessageCreateParamsNonStreaming, MessageParam, ToolResultBlockParam, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages/messages";
import { db } from "@/lib/db";
import { BUSINESS_TZ } from "@/lib/contact";
import type { Locale } from "@/server/catalog";
import type { ChatConfig } from "./config";
import { SYSTEM_PROMPT, contextBlock } from "./system-prompt";
import { TOOLS, runTool, type Card, type Draft } from "./tools";
import { budgetLeft, callEstimate, costOf, recordError, recordUsage } from "./usage";

/** One model call (streamed). Injected so tests can run the whole loop against a scripted fake. */
export type ModelCall = (params: MessageCreateParamsNonStreaming, onText: (t: string) => void, signal: AbortSignal) => Promise<Message>;

export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "cards"; cards: Card[] }
  | { type: "draft"; draft: Draft }
  | { type: "error"; code: "BUDGET" | "UNAVAILABLE" | "LIMIT" }
  | { type: "done" };

const MAX_TOOLS_PER_ROUND = 4;

export async function history(sessionId: string, take: number): Promise<MessageParam[]> {
  const rows = await db.chatMessage.findMany({ where: { sessionId }, orderBy: { createdAt: "desc" }, take, select: { role: true, text: true } });
  const msgs = rows.reverse().filter((r) => !/^\[[A-Z]+\]$/.test(r.text)).map((r) => ({ role: r.role as "user" | "assistant", content: r.text }));
  // The API needs the first message to be from the user and roles to alternate.
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  const out: MessageParam[] = [];
  for (const m of msgs) {
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content = `${last.content}\n\n${m.content}`;
    else out.push({ ...m });
  }
  return out;
}

/**
 * One visitor turn: stores the question, runs the tool loop (bounded rounds, budget checked before every call),
 * streams text/cards/drafts through `emit`, stores the answer. Never throws to the caller.
 */
export async function runTurn(o: { sessionId: string; locale: Locale; text: string; cfg: ChatConfig; call: ModelCall; emit: (e: ChatEvent) => void; signal: AbortSignal; now?: Date }) {
  const { cfg, emit } = o;
  const now = o.now ?? new Date();
  const past = await history(o.sessionId, cfg.maxHistory);
  await db.chatMessage.create({ data: { sessionId: o.sessionId, role: "user", text: o.text } });
  await db.chatSession.update({ where: { id: o.sessionId }, data: { messages: { increment: 1 }, lastAt: now } });

  const messages: MessageParam[] = [...past];
  if (messages.length && messages[messages.length - 1].role === "user") messages.pop(); // unanswered previous question: replaced by the new one
  messages.push({ role: "user", content: o.text });

  let answer = "";
  const used = new Set<string>();
  let unanswered = false;
  let failed: ChatEvent | null = null;

  try {
    for (let round = 0; round <= cfg.maxToolRounds; round++) {
      const budget = await budgetLeft(cfg, callEstimate(cfg), now);
      if (budget !== "OK") {
        failed = { type: "error", code: "BUDGET" };
        break;
      }
      const last = round === cfg.maxToolRounds;
      const params: MessageCreateParamsNonStreaming = {
        model: cfg.model!,
        max_tokens: cfg.maxOutputTokens,
        system: [
          { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
          { type: "text", text: contextBlock(o.locale, now, BUSINESS_TZ) },
        ],
        tools: TOOLS,
        // Last allowed round: no more tools, the model must answer with what it has.
        ...(last ? { tool_choice: { type: "none" as const } } : {}),
        messages,
      };
      let roundText = "";
      const msg = await o.call(params, (t) => {
        roundText += t;
        emit({ type: "text", text: t });
      }, o.signal);
      await recordUsage(msg.usage, costOf(msg.usage, cfg.price), o.sessionId);
      answer += roundText;

      const calls = msg.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
      if (msg.stop_reason !== "tool_use" || calls.length === 0) break;

      messages.push({ role: "assistant", content: msg.content });
      const results: ToolResultBlockParam[] = [];
      for (const [i, c] of calls.entries()) {
        used.add(c.name);
        if (i >= MAX_TOOLS_PER_ROUND) {
          results.push({ type: "tool_result", tool_use_id: c.id, content: "Skipped: too many tool calls in one step", is_error: true });
          continue;
        }
        const r = await runTool(c.name, c.input, { sessionId: o.sessionId, locale: o.locale, now });
        if (r.cards?.length) emit({ type: "cards", cards: r.cards });
        if (r.draft) emit({ type: "draft", draft: r.draft });
        if (r.unanswered) unanswered = true;
        results.push({ type: "tool_result", tool_use_id: c.id, content: r.content, ...(r.isError ? { is_error: true } : {}) });
      }
      messages.push({ role: "user", content: results });
      if (roundText) {
        answer += "\n\n";
      }
    }
  } catch (e) {
    if (o.signal.aborted) return; // visitor closed the chat; nothing to store
    console.error("[chat] model call failed", e instanceof Error ? `${e.name}: ${e.message}` : e);
    await recordError().catch(() => {});
    failed = { type: "error", code: "UNAVAILABLE" };
  }

  answer = answer.trim();
  if (failed) emit(failed);
  if (answer || failed)
    await db.chatMessage.create({ data: { sessionId: o.sessionId, role: "assistant", text: answer || `[${failed!.type === "error" ? failed!.code : "ERROR"}]`, tools: [...used], unanswered: unanswered || (!!failed && !answer) } });
  emit({ type: "done" });
}
