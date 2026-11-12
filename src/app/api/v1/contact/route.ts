import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, handleError, json, limit, parse, problem, readJson } from "@/server/http";
import { verifyChallenge } from "@/server/challenge";
import { notifyStaff } from "@/server/mail";
import { contactEmail } from "@/server/email-templates";
import { CONTACT_TOPICS, CONTACT_TOPIC_LABELS } from "@/content/contact-topics";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  subject: z.string().trim().max(200).optional(),
  topic: z.enum(CONTACT_TOPICS).optional(),
  message: z.string().trim().max(5000).optional(),
  locale: z.enum(["en", "tr", "de", "ru"]).default("en"),
  website: z.string().max(0).optional(), // honeypot: bots fill it
  challenge: z.string().max(200).optional(),
  answer: z.union([z.string().max(5), z.number()]).optional(),
});

/** Contact form (replaces Contact Form 7). Stored first, then mailed to info@ if SMTP is configured. */
export async function POST(req: Request) {
  const limited = await limit(req, "contact", 5, 600);
  if (limited) return limited;
  try {
    const v = parse(schema, await readJson(req));
    const check = await verifyChallenge(v.challenge, v.answer);
    if (check !== "OK") {
      console.warn("[contact] challenge", check);
      return problem(422, `CHALLENGE_${check}`, "Please answer the security question");
    }
    const rawSubject = v.subject;
    // Staff read the English topic label, whatever language the visitor used.
    v.subject = [v.topic ? CONTACT_TOPIC_LABELS[v.topic] : "", v.subject].filter(Boolean).join(" — ") || undefined;
    const msg = await db.contactMessage.create({ data: { name: v.name, email: v.email.toLowerCase(), subject: v.subject, message: v.message, locale: v.locale, ip: clientIp(req) } });
    const sent = await notifyStaff(contactEmail({ name: v.name, email: v.email, topic: v.topic ? CONTACT_TOPIC_LABELS[v.topic] : null, subject: rawSubject ?? null, message: v.message ?? null, locale: v.locale, createdAt: msg.createdAt }));
    if (sent) await db.contactMessage.update({ where: { id: msg.id }, data: { emailedAt: new Date() } });
    return json({ ok: true }, 201);
  } catch (e) {
    return handleError(e);
  }
}
