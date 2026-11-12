import "server-only";
import nodemailer from "nodemailer";
import { SITE } from "@/lib/site";

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

/**
 * SMTP via env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 * Port 25/587 use STARTTLS when offered (SMTP_REQUIRE_TLS=true makes it mandatory before AUTH).
 * Returns false when not configured or on failure; callers never fail a customer action because of mail.
 */
export async function sendMail(m: { to: string | string[]; subject: string; text: string; replyTo?: string }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_FROM) return false;
  const port = Number(SMTP_PORT ?? 587);
  transport ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  try {
    await transport.sendMail({ from: { name: SITE.name, address: SMTP_FROM }, to: m.to, subject: m.subject, text: m.text, replyTo: m.replyTo });
    return true;
  } catch (e) {
    console.error("[mail] send failed", e instanceof Error ? e.message : e);
    return false;
  }
}

/** Staff inbox(es) for every booking, contact message and assistant request: NOTIFY_EMAILS (comma separated), else the site e-mail. */
export function staffRecipients(): string[] {
  const list = (process.env.NOTIFY_EMAILS ?? "").split(",").map((s) => s.trim()).filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
  return list.length ? list : [SITE.email];
}

export const notifyStaff = (m: { subject: string; text: string; replyTo?: string }) => sendMail({ ...m, to: staffRecipients() });
