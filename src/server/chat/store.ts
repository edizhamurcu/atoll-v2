import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { readyRedis } from "@/lib/redis";
import { SITE } from "@/lib/site";
import { notifyStaff } from "@/server/mail";
import { adminSwitch, chatConfig, configProblem, type ChatConfig } from "./config";

export const SESSION_RE = /^[a-f0-9]{32}$/;

/** IPs are stored only as a salted hash (abuse tracing without keeping the address). */
export const ipHash = (ip: string) => createHash("sha256").update(`chat:${process.env.REVIEW_SECRET ?? process.env.DATABASE_URL ?? ""}:${ip}`).digest("hex").slice(0, 32);

export async function chatStatus(cfg: ChatConfig = chatConfig()) {
  const problem = configProblem(cfg);
  const on = await adminSwitch();
  return { ready: !problem && on, problem: problem ?? (on ? null : "ADMIN_OFF"), cfg };
}

/** Existing session (if the id is valid and known) or a new one. */
export async function openSession(id: string | undefined, locale: string, page: string | undefined, ip: string) {
  if (id && SESSION_RE.test(id)) {
    const s = await db.chatSession.findUnique({ where: { id } });
    if (s) return s;
  }
  return db.chatSession.create({ data: { id: randomBytes(16).toString("hex"), locale, page: page?.slice(0, 200), ipHash: ipHash(ip) } });
}

/** One running answer per session at a time (a second tab or double submit gets 409). Fails open without Redis. */
export async function lockSession(id: string, ttlSec = 90): Promise<(() => Promise<void>) | null> {
  const r = await readyRedis(500);
  if (!r) return async () => {};
  const key = `chat:lock:${id}`, token = randomBytes(8).toString("hex");
  try {
    const ok = await r.set(key, token, "EX", ttlSec, "NX");
    if (!ok) return null;
  } catch {
    return async () => {};
  }
  return async () => {
    try {
      if ((await r.get(key)) === token) await r.del(key);
    } catch {}
  };
}

const KIND_EN: Record<string, string> = { HANDOFF: "Talk to staff", RENTAL_CALLBACK: "Rental callback", SALES_INQUIRY: "OSK sales inquiry", TEST_DRIVE: "OSK test drive", SERVICE_APPOINTMENT: "OSK service appointment" };

/**
 * The visitor pressed Confirm. Idempotent: confirming twice returns the same result and mails once.
 * Only the owner session can confirm its own draft (anything else is 404).
 */
export async function confirmRequest(id: string, sessionId: string): Promise<"OK" | "NOT_FOUND" | "CANCELLED"> {
  const r = await db.chatRequest.findFirst({ where: { id, sessionId } });
  if (!r) return "NOT_FOUND";
  if (r.status === "CANCELLED") return "CANCELLED";
  if (r.status !== "DRAFT") return "OK";
  const { count } = await db.chatRequest.updateMany({ where: { id, sessionId, status: "DRAFT" }, data: { status: "SUBMITTED", confirmedAt: new Date() } });
  if (count === 0) return "OK"; // a parallel click won the race
  const sent = await notifyStaff({
    replyTo: r.email ?? undefined,
    subject: `${SITE.name} assistant: ${KIND_EN[r.kind] ?? r.kind} – ${r.name}`,
    text: `${KIND_EN[r.kind] ?? r.kind}\nName: ${r.name}\nPhone: ${r.phone}\nE-mail: ${r.email ?? "-"}\nPreferred time: ${r.preferred ?? "-"}\nLanguage: ${r.locale}\n\n${r.details}\n\n--\nConfirmed by the visitor in the website assistant. Admin: /admin/assistant`,
  });
  if (sent) await db.chatRequest.update({ where: { id }, data: { emailedAt: new Date() } });
  return "OK";
}

export async function dismissRequest(id: string, sessionId: string) {
  const { count } = await db.chatRequest.updateMany({ where: { id, sessionId, status: "DRAFT" }, data: { status: "CANCELLED", decidedAt: new Date() } });
  return count > 0;
}

/** Deletes conversations older than the retention period (cascade removes messages and requests). Runs at most once a day per process via Redis. */
export async function purgeOld(cfg: ChatConfig = chatConfig(), force = false) {
  if (!force) {
    const r = await readyRedis(300);
    const day = new Date().toISOString().slice(0, 10);
    if (r) {
      try {
        if (!(await r.set(`chat:purge:${day}`, "1", "EX", 90_000, "NX"))) return 0;
      } catch {
        return 0;
      }
    }
  }
  const cutoff = new Date(Date.now() - cfg.retentionDays * 86_400_000);
  const { count } = await db.chatSession.deleteMany({ where: { lastAt: { lt: cutoff } } });
  return count;
}
