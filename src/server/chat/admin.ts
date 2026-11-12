import "server-only";
import Decimal from "decimal.js";
import { db } from "@/lib/db";
import { chatStatus } from "./store";
import { spend } from "./usage";

/** Everything the /admin/assistant page shows. No secret values: the key is reported only as present/absent. */
export async function assistantOverview() {
  const status = await chatStatus();
  const since = new Date(Date.now() - 14 * 86_400_000);
  const [s, days, requests, unanswered, sessions, drafts] = await Promise.all([
    spend(),
    db.chatUsage.findMany({ where: { day: { gte: since } }, orderBy: { day: "desc" } }),
    db.chatRequest.findMany({ where: { status: { in: ["SUBMITTED", "HANDLED", "CANCELLED"] }, confirmedAt: { not: null } }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.chatMessage.findMany({ where: { unanswered: true, role: "assistant" }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, sessionId: true, createdAt: true, text: true } }),
    db.chatSession.findMany({ orderBy: { lastAt: "desc" }, take: 30, include: { _count: { select: { requests: { where: { status: { not: "DRAFT" } } } } } } }),
    db.chatRequest.count({ where: { status: "DRAFT" } }),
  ]);
  // The question behind each unanswered reply = the user message just before it.
  const questions = await Promise.all(
    unanswered.map(async (u) => {
      const q = await db.chatMessage.findFirst({ where: { sessionId: u.sessionId, role: "user", createdAt: { lte: u.createdAt } }, orderBy: { createdAt: "desc" }, select: { text: true } });
      return { ...u, question: q?.text ?? "" };
    }),
  );
  return { status, today: s.today, month: s.month, days, requests, unanswered: questions, sessions, drafts };
}

export async function transcript(id: string) {
  if (!/^[a-f0-9]{32}$/.test(id)) return null;
  return db.chatSession.findUnique({ where: { id }, include: { log: { orderBy: { createdAt: "asc" } }, requests: { orderBy: { createdAt: "asc" } } } });
}

export const usd = (v: Decimal | { toString(): string } | number) => `$${new Decimal(v.toString()).toFixed(4)}`;
