import "server-only";
import { BookingError } from "./booking";
import { NOTE_TOPIC_LABELS, type NoteTopic } from "@/content/booking-notes";

/** Humans need at least this long between reserving a car and submitting the driver form. */
export const MIN_FILL_MS = 3000;

// Two regexes on purpose: a /g regex keeps lastIndex between .test() calls and would let every other spam through.
const HAS_URL = /(https?:\/\/|www\.)\S+/i;
const ALL_URLS = /(https?:\/\/|www\.)\S+/gi;

/** Cheap content heuristics: links in name fields or a notes field stuffed with links. */
export function spamReason(c: { firstName: string; lastName: string; notes?: string }): string | null {
  if (HAS_URL.test(`${c.firstName} ${c.lastName}`)) return "link in name";
  if ((c.notes?.match(ALL_URLS) ?? []).length > 2) return "too many links in notes";
  return null;
}

/** Notes as staff read them: the chosen topic (English label) on the first line, then the customer's text. */
export function composeNotes(topic: NoteTopic | undefined, text: string | undefined): string | undefined {
  const body = text?.trim();
  const head = topic ? `Topic: ${NOTE_TOPIC_LABELS[topic]}` : "";
  const out = [head, body].filter(Boolean).join("\n");
  return out ? out.slice(0, 1000) : undefined;
}

export const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SITE_KEY);

/**
 * Cloudflare Turnstile server check. Disabled (passes) until both keys are configured.
 * A rejected token fails closed; a Cloudflare outage or timeout fails open (logged) because the
 * honeypot, fill-time check and per-IP rate limit still apply and real bookings must not be lost.
 */
export async function verifyTurnstile(token: string | undefined, ip: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileEnabled() || !secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`siteverify HTTP ${res.status}`);
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.warn("[antispam] turnstile unavailable, allowing request:", e instanceof Error ? e.message : e);
    return true;
  }
}

/** Generic message on purpose: do not tell bots which check tripped. */
export const spamError = () => new BookingError("SPAM_CHECK", "We could not verify this request. Please try again.", 422);
