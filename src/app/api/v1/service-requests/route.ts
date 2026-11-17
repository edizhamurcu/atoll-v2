import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, handleError, json, limit, parse, problem, readJson } from "@/server/http";
import { verifyChallenge } from "@/server/challenge";
import { notifyServiceRequest } from "@/server/service-requests";
import { formatQueueNo, SERVICE_KINDS } from "@/content/service";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30).regex(/^[+\d][\d\s()\-.]{5,}$/, "Invalid phone number"),
  email: z.union([z.literal(""), z.email().max(200)]).optional(),
  vehicleMake: z.string().trim().min(2).max(120),
  vehiclePlate: z.string().trim().min(2).max(20),
  vehicleYear: z.coerce.number().int().min(1950).max(2100).optional(),
  boughtFromOsk: z.boolean().default(false),
  services: z.array(z.enum(SERVICE_KINDS)).min(1).max(5),
  details: z.string().trim().max(3000).optional(),
  preferredDate: z.iso.date().optional(),
  locale: z.enum(["en", "tr", "de", "ru"]).default("en"),
  website: z.string().max(0).optional(), // honeypot
  challenge: z.string().max(200).optional(),
  answer: z.union([z.string().max(5), z.number()]).optional(),
});

/** OSK service request: stored, gets a queue number, then mailed to manager@ and info@. */
export async function POST(req: Request) {
  const limited = await limit(req, "service", 5, 600);
  if (limited) return limited;
  try {
    const v = parse(schema, await readJson(req));
    const check = await verifyChallenge(v.challenge, v.answer);
    if (check !== "OK") return problem(422, `CHALLENGE_${check}`, "Please answer the security question");
    if (v.details && /https?:\/\/|www\./i.test(v.details)) return problem(422, "NO_LINKS", "Links are not allowed");
    const r = await db.serviceRequest.create({
      data: {
        name: v.name, phone: v.phone, email: v.email ? v.email.toLowerCase() : null, vehicleMake: v.vehicleMake, vehiclePlate: v.vehiclePlate.toUpperCase(),
        vehicleYear: v.vehicleYear, boughtFromOsk: v.boughtFromOsk, services: [...new Set(v.services)], details: v.details || null,
        preferredDate: v.preferredDate ? new Date(`${v.preferredDate}T00:00:00Z`) : null, locale: v.locale, ip: clientIp(req),
      },
    });
    after(() => notifyServiceRequest(r.id));
    return json({ ok: true, queueNo: r.queueNo, number: formatQueueNo(r.queueNo) }, 201);
  } catch (e) {
    return handleError(e);
  }
}
