import { z } from "zod";
import { clientIp, handleError, json, limit, problem, readJson } from "@/server/http";
import { chatStatus, lockSession, openSession, purgeOld } from "@/server/chat/store";
import { runTurn, type ChatEvent } from "@/server/chat/engine";
import { anthropicCall } from "@/server/chat/client";
import type { Locale } from "@/server/catalog";

/** Is the assistant answering right now? (The widget hides itself when not.) */
export async function GET() {
  const s = await chatStatus();
  return json({ enabled: s.ready }, { headers: { "cache-control": "no-store" } });
}

const Body = z.object({
  sessionId: z.string().regex(/^[a-f0-9]{32}$/).nullish().transform((v) => v ?? undefined),
  message: z.string().trim().min(1),
  locale: z.enum(["en", "tr", "de", "ru"]).default("en"),
  page: z.string().max(200).regex(/^\/[\w\-/.#?=&%]*$/).optional(),
});

/** One visitor message → Server-Sent Events: session, text deltas, cards, drafts, error, done. */
export async function POST(req: Request) {
  const limited = (await limit(req, "chat", 20, 600)) ?? (await limit(req, "chat-day", 150, 86_400));
  if (limited) return limited;
  try {
    const s = await chatStatus();
    if (!s.ready) return problem(503, "CHAT_DISABLED", "The assistant is not available right now");
    const cfg = s.cfg;
    const raw = await readJson(req, 16_384);
    const b = Body.parse(raw);
    if (b.message.length > cfg.maxInputChars) return problem(413, "MESSAGE_TOO_LONG", `Maximum ${cfg.maxInputChars} characters`);

    const session = await openSession(b.sessionId, b.locale, b.page, clientIp(req));
    if (session.messages >= cfg.maxSessionMessages) return problem(429, "SESSION_LIMIT", "This conversation is too long; please contact us directly");
    const unlock = await lockSession(session.id);
    if (!unlock) return problem(409, "BUSY", "Still answering the previous message");
    purgeOld(cfg).catch(() => {});

    const enc = new TextEncoder();
    const ctl = new AbortController();
    req.signal.addEventListener("abort", () => ctl.abort());
    const stream = new ReadableStream({
      async start(c) {
        const send = (e: ChatEvent | { type: "session"; sessionId: string }) => {
          try {
            c.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
          } catch {}
        };
        send({ type: "session", sessionId: session.id });
        try {
          await runTurn({ sessionId: session.id, locale: b.locale as Locale, text: b.message, cfg, call: anthropicCall(cfg), emit: send, signal: ctl.signal });
        } finally {
          await unlock();
          try {
            c.close();
          } catch {}
        }
      },
      cancel() {
        ctl.abort();
      },
    });
    return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store, no-transform", "x-accel-buffering": "no" } });
  } catch (e) {
    return handleError(e);
  }
}
