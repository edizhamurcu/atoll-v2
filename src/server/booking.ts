import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { computeQuote, PricingError, type Quote } from "./pricing";
import { getSettings, type BusinessSettings } from "./settings";
import { freeVehicleIds } from "./availability";

export class BookingError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

export interface QuoteRequest {
  modelSlug: string;
  pickupAt: Date;
  returnAt: Date;
  pickupLocation: string; // slug
  returnLocation: string; // slug
  deliveryZone?: string | null; // slug
  extras: { code: string; quantity: number }[];
  /** Staff bookings (walk-ins) skip the online lead time. */
  allowImmediate?: boolean;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
function newRef() {
  const b = randomBytes(6);
  return "ATL-" + Array.from(b, (x) => REF_ALPHABET[x % REF_ALPHABET.length]).join("");
}

export function validateWindow(s: BusinessSettings, pickupAt: Date, returnAt: Date, now = new Date(), allowImmediate = false) {
  if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(returnAt.getTime())) throw new BookingError("INVALID_DATE", "Invalid date");
  if (returnAt <= pickupAt) throw new BookingError("INVALID_RANGE", "Return must be after pickup");
  if (pickupAt.getTime() < now.getTime() + (allowImmediate ? -30 : s.leadTimeMinutes) * 60_000)
    throw new BookingError("LEAD_TIME", `Pick-up must be at least ${Math.round(s.leadTimeMinutes / 60)} hours from now`);
  if (pickupAt.getTime() > now.getTime() + 548 * 86_400_000) throw new BookingError("TOO_FAR", "Bookings open up to 18 months ahead");
}

/** Loads everything the pure pricing engine needs and returns a quote. */
export async function buildQuote(req: QuoteRequest, s?: BusinessSettings) {
  const settings = s ?? (await getSettings());
  validateWindow(settings, req.pickupAt, req.returnAt, new Date(), req.allowImmediate);

  const [model, pickup, ret, zone, extras, discounts] = await Promise.all([
    db.vehicleModel.findFirst({ where: { slug: req.modelSlug, active: true }, include: { seasonRates: { orderBy: { createdAt: "asc" } } } }),
    db.location.findFirst({ where: { slug: req.pickupLocation, active: true } }),
    db.location.findFirst({ where: { slug: req.returnLocation, active: true } }),
    req.deliveryZone ? db.deliveryZone.findFirst({ where: { slug: req.deliveryZone, active: true } }) : Promise.resolve(null),
    req.extras.length ? db.extra.findMany({ where: { code: { in: req.extras.map((e) => e.code) }, active: true } }) : Promise.resolve([]),
    db.durationDiscount.findMany({ where: { active: true } }),
  ]);
  if (!model) throw new BookingError("MODEL_NOT_FOUND", "Vehicle not found", 404);
  if (!pickup || !ret) throw new BookingError("LOCATION_NOT_FOUND", "Location not found", 404);
  if (req.deliveryZone && !zone) throw new BookingError("ZONE_NOT_FOUND", "Delivery area not found", 404);
  const byCode = new Map(extras.map((e) => [e.code, e]));
  for (const e of req.extras) if (!byCode.has(e.code)) throw new BookingError("EXTRA_NOT_FOUND", `Unknown extra ${e.code}`, 404);

  try {
    const quote = computeQuote({
      pickupAt: req.pickupAt,
      returnAt: req.returnAt,
      baseDailyRate: model.dailyRate.toString(),
      seasonRates: model.seasonRates.map((r) => ({
        startDate: r.startDate.toISOString().slice(0, 10),
        endDate: r.endDate.toISOString().slice(0, 10),
        dailyRate: r.dailyRate.toString(),
      })),
      discounts: discounts.map((d) => ({ minDays: d.minDays, percent: d.percent.toString() })),
      extras: req.extras.map((e) => {
        const x = byCode.get(e.code)!;
        return { extra: { id: x.id, code: x.code, pricing: x.pricing, price: x.price.toString(), maxQty: x.maxQty }, quantity: e.quantity };
      }),
      pickupFee: pickup.pickupFee.toString(),
      returnFee: ret.returnFee.toString(),
      deliveryTiers: zone ? (zone.tiers as { minDays: number; fee: string }[]) : null,
      rules: settings,
    });
    return { quote, model, pickup, ret, zone, extras: byCode, settings };
  } catch (e) {
    if (e instanceof PricingError) throw new BookingError(e.code, e.message);
    throw e;
  }
}

const isExclusionViolation = (e: unknown) =>
  JSON.stringify(e ?? "").includes("23P01") || String((e as Error)?.message ?? "").includes("booking_no_overlap");

/**
 * Reserve a concrete vehicle of the requested model for the checkout window.
 * Concurrency: candidate rows are locked FOR UPDATE SKIP LOCKED and re-checked; the
 * booking_no_overlap exclusion constraint is the final guarantee against double booking.
 */
export async function createHold(req: QuoteRequest & { idempotencyKey?: string; locale?: string; source?: string }) {
  if (req.idempotencyKey) {
    const existing = await db.booking.findUnique({ where: { idempotencyKey: req.idempotencyKey } });
    if (existing) throw new BookingError("IDEMPOTENT_REPLAY", "This request was already processed", 409);
  }
  const { quote, model, pickup, ret, zone, extras, settings } = await buildQuote(req);
  const blockedUntil = new Date(req.returnAt.getTime() + settings.bufferMinutes * 60_000);
  const holdExpiresAt = new Date(Date.now() + settings.holdMinutes * 60_000);
  const token = randomBytes(24).toString("base64url");

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const booking = await db.$transaction(async (tx) => {
        // Release expired holds on this model so the exclusion constraint does not count them.
        await tx.$executeRaw`UPDATE "Booking" SET status = 'EXPIRED', "updatedAt" = now()
          WHERE status IN ('HOLD','PENDING_PAYMENT') AND "holdExpiresAt" <= now() AND "modelId" = ${model.id}`;

        const candidates = await freeVehicleIds(tx, [model.id], { start: req.pickupAt, end: blockedUntil });
        if (candidates.length === 0) throw new BookingError("SOLD_OUT", "No vehicle of this model is available for these dates", 409);
        // Prefer cars based at the pick-up location.
        candidates.sort((a, b) => Number(b.homeLocationId === pickup.id) - Number(a.homeLocationId === pickup.id));

        // Lock one candidate at a time; concurrent requests skip locked cars and take the next one.
        let chosen: { id: string } | undefined;
        for (const c of candidates) {
          const got: { id: string }[] = await tx.$queryRawUnsafe(`SELECT id FROM "Vehicle" WHERE id = $1 FOR UPDATE SKIP LOCKED`, c.id);
          if (got.length === 0) continue;
          // Re-check after locking: another transaction may have committed a booking meanwhile.
          const still = await freeVehicleIds(tx, [model.id], { start: req.pickupAt, end: blockedUntil }, [c.id]);
          if (still.length) {
            chosen = c;
            break;
          }
        }
        if (!chosen) throw new BookingError("SOLD_OUT", "No vehicle of this model is available for these dates", 409);

        return tx.booking.create({
          data: {
            ref: newRef(),
            status: "HOLD",
            modelId: model.id,
            vehicleId: chosen.id,
            pickupLocationId: pickup.id,
            returnLocationId: ret.id,
            deliveryZoneId: zone?.id,
            pickupAt: req.pickupAt,
            returnAt: req.returnAt,
            blockedUntil,
            days: quote.days,
            rentalTotal: quote.rentalTotal,
            discountTotal: quote.discountTotal,
            extrasTotal: quote.extrasTotal,
            feesTotal: quote.feesTotal,
            grandTotal: quote.grandTotal,
            depositAmount: quote.depositAmount,
            priceBreakdown: quote as unknown as Prisma.InputJsonValue,
            holdExpiresAt,
            idempotencyKey: req.idempotencyKey,
            accessTokenHash: sha256(token),
            locale: req.locale ?? "en",
            source: req.source ?? "web",
            extras: {
              create: req.extras.map((e) => {
                const x = extras.get(e.code)!;
                const line = quote.lines.find((l) => l.kind === "extra" && l.code === e.code)!;
                return { extraId: x.id, quantity: e.quantity, unitPrice: line.unit, total: line.total };
              }),
            },
          },
          select: { id: true, ref: true, holdExpiresAt: true, status: true },
        });
      });
      return { ...booking, token, quote };
    } catch (e) {
      if (e instanceof BookingError) throw e;
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const target = String((e.meta as { target?: unknown })?.target ?? "");
        if (target.includes("idempotencyKey")) throw new BookingError("IDEMPOTENT_REPLAY", "This request was already processed", 409);
        continue; // ref collision — retry
      }
      if (isExclusionViolation(e)) continue; // lost a race — retry with fresh candidates
      throw e;
    }
  }
  throw new BookingError("SOLD_OUT", "No vehicle of this model is available for these dates", 409);
}

export async function getBookingForCustomer(ref: string, token: string) {
  const b = await db.booking.findUnique({
    where: { ref },
    include: { model: true, pickupLocation: true, returnLocation: true, deliveryZone: true, customer: true, extras: { include: { extra: true } } },
  });
  if (!b) throw new BookingError("NOT_FOUND", "Booking not found", 404);
  const a = Buffer.from(b.accessTokenHash, "hex");
  const c = Buffer.from(sha256(token || ""), "hex");
  if (a.length !== c.length || !timingSafeEqual(a, c)) throw new BookingError("NOT_FOUND", "Booking not found", 404); // no oracle
  return b;
}

export interface CustomerInput {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country?: string;
  licenseNumber?: string;
  flightNumber?: string;
  deliveryAddress?: string;
  notes?: string;
}

/**
 * Turns a live HOLD into a booking. With paymentMode "deposit" it moves to PENDING_PAYMENT
 * (Stripe Checkout confirms it via webhook); "pay_on_pickup" confirms immediately.
 */
export async function confirmHold(ref: string, token: string, customer: CustomerInput, paymentMode: "deposit" | "pay_on_pickup") {
  const b = await getBookingForCustomer(ref, token);
  if (b.status !== "HOLD") throw new BookingError("NOT_HOLD", `Booking is ${b.status.toLowerCase()}`, 409);
  if (!b.holdExpiresAt || b.holdExpiresAt <= new Date()) throw new BookingError("HOLD_EXPIRED", "Your reservation hold expired. Please search again.", 410);
  if (b.deliveryZoneId && !customer.deliveryAddress?.trim()) throw new BookingError("ADDRESS_REQUIRED", "Delivery address is required");

  const email = customer.email.trim().toLowerCase();
  const cust = await db.customer.upsert({
    where: { email },
    create: { email, firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone, country: customer.country, licenseNumber: customer.licenseNumber },
    update: { firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone, country: customer.country, licenseNumber: customer.licenseNumber ?? undefined },
  });
  const deposit = paymentMode === "deposit";
  const stripeHoldMinutes = 30;
  // Conditional update guards against double submit / expiry race.
  const res = await db.booking.updateMany({
    where: { id: b.id, status: "HOLD", holdExpiresAt: { gt: new Date() } },
    data: {
      customerId: cust.id,
      status: deposit ? "PENDING_PAYMENT" : "CONFIRMED",
      paymentMode,
      paymentStatus: deposit ? "REQUIRES_PAYMENT" : "NONE",
      holdExpiresAt: deposit ? new Date(Date.now() + stripeHoldMinutes * 60_000) : null,
      confirmedAt: deposit ? null : new Date(),
      flightNumber: customer.flightNumber,
      deliveryAddress: customer.deliveryAddress,
      notes: customer.notes,
    },
  });
  if (res.count !== 1) throw new BookingError("HOLD_EXPIRED", "Your reservation hold expired. Please search again.", 410);
  return db.booking.findUniqueOrThrow({ where: { id: b.id }, include: { customer: true, model: true, pickupLocation: true, returnLocation: true } });
}

export async function markDepositPaid(bookingId: string, stripeSessionId: string) {
  // Idempotent: a webhook retry after success changes nothing.
  return db.booking.updateMany({
    where: { id: bookingId, status: { in: ["PENDING_PAYMENT", "EXPIRED"] } },
    data: { status: "CONFIRMED", paymentStatus: "PAID", stripeSessionId, holdExpiresAt: null, confirmedAt: new Date() },
  });
}

export type { Quote };
