import "server-only";
import nodemailer from "nodemailer";

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
/** SMTP via env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM). Returns false when not configured or on failure. */
export async function sendMail(m: { to: string; subject: string; text: string; replyTo?: string }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_FROM) return false;
  transport ??= nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT ?? 587), secure: Number(SMTP_PORT) === 465, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined });
  try {
    await transport.sendMail({ from: SMTP_FROM, to: m.to, subject: m.subject, text: m.text, replyTo: m.replyTo });
    return true;
  } catch (e) {
    console.error("[mail] send failed", e instanceof Error ? e.message : e);
    return false;
  }
}
