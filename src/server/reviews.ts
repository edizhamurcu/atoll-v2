import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Review links: /<locale>/review/<ref>.<sig>, sig = HMAC(ref). Nothing is stored until the customer submits,
 * so the admin booking page can always show the link. Secret: REVIEW_SECRET, else derived from DATABASE_URL
 * (which contains the database password and never leaves the server).
 */
function secret() {
  const s = process.env.REVIEW_SECRET || createHash("sha256").update(`review:${process.env.DATABASE_URL ?? ""}`).digest("hex");
  if (!s) throw new Error("no review secret");
  return s;
}
const sign = (ref: string) => createHmac("sha256", secret()).update(ref).digest("base64url").slice(0, 22);

export const reviewToken = (ref: string) => `${ref}.${sign(ref)}`;

export function parseReviewToken(token: string): string | null {
  const m = /^(ATL-[A-Z0-9]+)\.([A-Za-z0-9_-]{22})$/.exec(token);
  if (!m) return null;
  const a = Buffer.from(m[2]), b = Buffer.from(sign(m[1]));
  return a.length === b.length && timingSafeEqual(a, b) ? m[1] : null;
}

/** A review can be left once the rental has started, for confirmed or completed bookings. */
export async function reviewTarget(ref: string) {
  const b = await db.booking.findUnique({
    where: { ref },
    select: { id: true, ref: true, status: true, pickupAt: true, locale: true, modelId: true, model: { select: { make: true, model: true } }, customer: { select: { firstName: true, lastName: true, country: true } }, review: { select: { id: true } } },
  });
  if (!b) return { state: "invalid" as const };
  if (!["CONFIRMED", "COMPLETED"].includes(b.status)) return { state: "invalid" as const };
  if (b.review) return { state: "done" as const, booking: b };
  if (b.pickupAt.getTime() > Date.now()) return { state: "early" as const, booking: b };
  return { state: "open" as const, booking: b };
}

const URLS = /(https?:\/\/|www\.)/gi;
export const ReviewInput = z.object({
  token: z.string().max(80),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(20).max(1500).refine((t) => (t.match(URLS) ?? []).length === 0, "NO_LINKS"),
  name: z.string().trim().min(2).max(40).refine((t) => !/(https?:\/\/|www\.)/i.test(t), "NO_LINKS"),
  country: z.string().trim().max(40).optional().or(z.literal("")),
  locale: z.enum(["en", "tr", "de", "ru"]),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
});

export async function submitReview(input: z.infer<typeof ReviewInput>) {
  const ref = parseReviewToken(input.token);
  if (!ref) return { error: "INVALID" as const };
  const t = await reviewTarget(ref);
  if (t.state !== "open") return { error: t.state === "done" ? ("DONE" as const) : t.state === "early" ? ("EARLY" as const) : ("INVALID" as const) };
  try {
    await db.review.create({ data: { bookingId: t.booking.id, modelId: t.booking.modelId, rating: input.rating, text: input.text, name: input.name, country: input.country || null, locale: input.locale } });
  } catch {
    return { error: "DONE" as const }; // unique bookingId: a parallel submit won
  }
  return { ok: true as const };
}

export type PublicReview = { id: string; rating: number; text: string; name: string; country: string | null; createdAt: Date; model: string };

/** Approved reviews (newest first) and their average; `modelSlug` narrows to one car model. */
export async function approvedReviews(opts: { modelSlug?: string; take?: number } = {}) {
  await connection();
  const where = { status: "APPROVED" as const, ...(opts.modelSlug ? { model: { slug: opts.modelSlug } } : {}) };
  const [rows, agg] = await Promise.all([
    db.review.findMany({ where, orderBy: { createdAt: "desc" }, take: opts.take ?? 6, select: { id: true, rating: true, text: true, name: true, country: true, createdAt: true, model: { select: { make: true, model: true } } } }),
    db.review.aggregate({ where, _avg: { rating: true }, _count: true }),
  ]);
  return {
    count: agg._count,
    average: agg._avg.rating ?? 0,
    reviews: rows.map((r): PublicReview => ({ id: r.id, rating: r.rating, text: r.text, name: r.name, country: r.country, createdAt: r.createdAt, model: `${r.model.make} ${r.model.model}` })),
  };
}

/* ---------- admin ---------- */

export async function bookingReview(bookingId: string) {
  return db.review.findUnique({ where: { bookingId }, select: { id: true, status: true, rating: true } });
}

export async function listReviewsAdmin(status?: "PENDING" | "APPROVED" | "REJECTED") {
  await connection();
  return db.review.findMany({
    where: status ? { status } : {},
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { booking: { select: { ref: true } }, model: { select: { make: true, model: true } } },
  });
}

export async function decideReview(id: string, status: "APPROVED" | "REJECTED" | "PENDING") {
  return db.review.update({ where: { id }, data: { status, decidedAt: status === "PENDING" ? null : new Date() } });
}
