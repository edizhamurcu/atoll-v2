import "server-only";
import nodemailer from "nodemailer";
import { SITE } from "@/lib/site";

const transports = new Map<string, ReturnType<typeof nodemailer.createTransport>>();

function transportFor(connectHost: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  const port = Number(SMTP_PORT ?? 587);
  let t = transports.get(connectHost);
  if (!t) {
    t = nodemailer.createTransport({
      host: connectHost,
      port,
      secure: port === 465,
      requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      // When connecting by IP, the certificate is still checked against the real mail host name.
      tls: { servername: SMTP_HOST },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    transports.set(connectHost, t);
  }
  return t;
}

/**
 * SMTP via env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM; SMTP_REQUIRE_TLS=true refuses to log in without STARTTLS.
 * SMTP_CONNECT_HOSTS (optional, comma separated IPs) are tried in random order before SMTP_HOST: the provider's
 * mail.enguclu.net has 6 nodes and 2 of them offer no STARTTLS, so we connect only to the ones that do.
 * Returns false when not configured or every attempt failed; callers never fail a customer action because of mail.
 */
export async function sendMail(m: { to: string | string[]; subject: string; text: string; replyTo?: string }) {
  const { SMTP_HOST, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_FROM) return false;
  const pinned = (process.env.SMTP_CONNECT_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean).sort(() => Math.random() - 0.5);
  const hosts = [...pinned.slice(0, 3), SMTP_HOST];
  for (const h of hosts) {
    try {
      await transportFor(h).sendMail({ from: { name: SITE.name, address: SMTP_FROM }, to: m.to, subject: m.subject, text: m.text, replyTo: m.replyTo });
      return true;
    } catch (e) {
      console.error(`[mail] send via ${h} failed`, e instanceof Error ? e.message : e);
    }
  }
  return false;
}

/** Staff inbox(es) for every booking, contact message and assistant request: NOTIFY_EMAILS (comma separated), else the site e-mail. */
export function staffRecipients(): string[] {
  const list = (process.env.NOTIFY_EMAILS ?? "").split(",").map((s) => s.trim()).filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
  return list.length ? list : [SITE.email];
}

export const notifyStaff = (m: { subject: string; text: string; replyTo?: string }) => sendMail({ ...m, to: staffRecipients() });
