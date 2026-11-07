import "server-only";
import { connection } from "next/server";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { db } from "@/lib/db";
import { Prisma, type BookingStatus } from "@/generated/prisma/client";
import { fleetStatusNow } from "../availability";
import { getSettings } from "../settings";
import { BookingError, confirmHold, createHold, type CustomerInput } from "../booking";
import { requireAdmin } from "./auth";

// Data Access Layer: every read/write checks the session itself. Layout guards are not enough
// (layouts and pages render in parallel, so a page can stream data even if the layout redirects).

const TZ = process.env.BUSINESS_TZ ?? "Asia/Famagusta";
const ACTIVE: BookingStatus[] = ["HOLD", "PENDING_PAYMENT", "CONFIRMED"];

/** Allowed manual status changes. */
export const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  HOLD: ["CANCELLED"],
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  CANCELLED: [],
  EXPIRED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

export function dayBounds(dateLocal: string) {
  const start = fromZonedTime(`${dateLocal}T00:00:00`, TZ);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}
export const todayLocal = () => formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");

const bookingInclude = { model: true, vehicle: true, customer: true, pickupLocation: true, returnLocation: true, deliveryZone: true, extras: { include: { extra: true } } } satisfies Prisma.BookingInclude;

export async function dashboard() {
  await connection();
  await requireAdmin();
  const { start, end } = dayBounds(todayLocal());
  const [pickups, returns, fleet, pending, upcoming] = await Promise.all([
    db.booking.findMany({ where: { status: "CONFIRMED", pickupAt: { gte: start, lt: end } }, include: bookingInclude, orderBy: { pickupAt: "asc" } }),
    db.booking.findMany({ where: { status: "CONFIRMED", returnAt: { gte: start, lt: end } }, include: bookingInclude, orderBy: { returnAt: "asc" } }),
    fleetStatusNow(),
    db.booking.count({ where: { status: "PENDING_PAYMENT" } }),
    db.booking.count({ where: { status: "CONFIRMED", pickupAt: { gte: end, lt: new Date(end.getTime() + 7 * 86_400_000) } } }),
  ]);
  const counts = { available: 0, on_rent: 0, maintenance: 0 } as Record<string, number>;
  for (const f of fleet) counts[f.state]++;
  return { pickups, returns, counts, pending, upcoming, fleetTotal: fleet.length };
}

export async function listBookings(f: { status?: string; q?: string; from?: string; page?: number }) {
  await connection();
  await requireAdmin();
  const where: Prisma.BookingWhereInput = {};
  if (f.status && f.status in TRANSITIONS) where.status = f.status as BookingStatus;
  if (f.from) where.pickupAt = { gte: dayBounds(f.from).start };
  const q = f.q?.trim();
  if (q) {
    where.OR = [
      { ref: { contains: q.toUpperCase() } },
      { vehicle: { plate: { contains: q.toUpperCase() } } },
      { customer: { email: { contains: q.toLowerCase() } } },
      { customer: { lastName: { contains: q, mode: "insensitive" } } },
      { customer: { phone: { contains: q } } },
    ];
  }
  const page = Math.max(1, f.page ?? 1);
  const [rows, total] = await Promise.all([
    db.booking.findMany({ where, include: bookingInclude, orderBy: { pickupAt: "desc" }, take: 50, skip: (page - 1) * 50 }),
    db.booking.count({ where }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / 50)) };
}

export async function getBookingAdmin(ref: string) {
  await connection();
  await requireAdmin();
  const b = await db.booking.findUnique({ where: { ref }, include: bookingInclude });
  if (!b) return null;
  const settings = await getSettings();
  // Vehicles of the same model that are free for this booking's window (for reassignment).
  const free: { id: string; plate: string }[] = await db.$queryRawUnsafe(
    `SELECT v.id, v.plate FROM "Vehicle" v
      WHERE v."modelId" = $1 AND v.status = 'ACTIVE' AND v.id <> $2
        AND NOT EXISTS (SELECT 1 FROM "Booking" b WHERE b."vehicleId" = v.id AND b.id <> $3
              AND (b.status = 'CONFIRMED' OR (b.status IN ('HOLD','PENDING_PAYMENT') AND b."holdExpiresAt" > now()))
              AND tstzrange(b."pickupAt", b."blockedUntil", '[)') && tstzrange($4::timestamptz, $5::timestamptz, '[)'))
        AND NOT EXISTS (SELECT 1 FROM "VehicleBlock" k WHERE k."vehicleId" = v.id
              AND tstzrange(k."startAt", k."endAt", '[)') && tstzrange($4::timestamptz, $5::timestamptz, '[)'))
      ORDER BY v.plate`,
    b.modelId, b.vehicleId, b.id, b.pickupAt, b.blockedUntil,
  );
  const history = await db.auditLog.findMany({ where: { entity: "Booking", entityId: b.id }, orderBy: { createdAt: "desc" }, take: 20 });
  return { booking: b, freeVehicles: free, history, settings };
}

export async function setStatus(ref: string, next: BookingStatus) {
  await requireAdmin();
  const b = await db.booking.findUnique({ where: { ref } });
  if (!b) throw new BookingError("NOT_FOUND", "Rezervasyon bulunamadı", 404);
  if (!TRANSITIONS[b.status].includes(next)) throw new BookingError("BAD_TRANSITION", `${b.status} → ${next} geçişi yapılamaz`);
  const data: Prisma.BookingUpdateInput = { status: next };
  if (next === "CANCELLED") data.cancelledAt = new Date();
  if (next === "CONFIRMED") { data.confirmedAt = new Date(); data.holdExpiresAt = null; }
  try {
    const r = await db.booking.updateMany({ where: { id: b.id, status: b.status }, data: data as Prisma.BookingUpdateManyMutationInput });
    if (r.count !== 1) throw new BookingError("CONFLICT", "Rezervasyon bu sırada değişti, sayfayı yenileyin", 409);
  } catch (e) {
    if (String((e as Error).message).match(/booking_no_overlap|23P01/)) throw new BookingError("OVERLAP", "Araç bu tarihlerde başka bir rezervasyonda", 409);
    throw e;
  }
  return b;
}

export async function reassignVehicle(ref: string, vehicleId: string) {
  await requireAdmin();
  const b = await db.booking.findUnique({ where: { ref } });
  if (!b) throw new BookingError("NOT_FOUND", "Rezervasyon bulunamadı", 404);
  const v = await db.vehicle.findUnique({ where: { id: vehicleId } });
  if (!v || v.modelId !== b.modelId) throw new BookingError("BAD_VEHICLE", "Araç bu modele ait değil");
  const block = await db.vehicleBlock.findFirst({ where: { vehicleId, startAt: { lt: b.blockedUntil }, endAt: { gt: b.pickupAt } } });
  if (block) throw new BookingError("BLOCKED", `Araç bu tarihlerde bloklu: ${block.reason}`, 409);
  try {
    await db.booking.update({ where: { id: b.id }, data: { vehicleId } });
  } catch (e) {
    if (String((e as Error).message).match(/booking_no_overlap|23P01/)) throw new BookingError("OVERLAP", "Araç bu tarihlerde dolu", 409);
    throw e;
  }
  return { from: b.vehicleId, to: vehicleId, id: b.id };
}

export async function createBlock(vehicleId: string, startAt: Date, endAt: Date, reason: string) {
  await requireAdmin();
  if (!(endAt > startAt)) throw new BookingError("INVALID_RANGE", "Bitiş başlangıçtan sonra olmalı");
  return db.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(`SELECT id FROM "Vehicle" WHERE id = $1 FOR UPDATE`, vehicleId); // serialise with booking creation
    const clash = await tx.booking.findFirst({
      where: { vehicleId, status: { in: ACTIVE }, pickupAt: { lt: endAt }, blockedUntil: { gt: startAt }, OR: [{ status: "CONFIRMED" }, { holdExpiresAt: { gt: new Date() } }] },
    });
    if (clash) throw new BookingError("OVERLAP", `Bu aralıkta rezervasyon var: ${clash.ref}. Önce aracı değiştirin.`, 409);
    return tx.vehicleBlock.create({ data: { vehicleId, startAt, endAt, reason } });
  });
}

export async function gantt(fromLocal: string, days: number) {
  await connection();
  await requireAdmin();
  const { start } = dayBounds(fromLocal);
  const end = new Date(start.getTime() + days * 86_400_000);
  const vehicles = await db.vehicle.findMany({
    where: { status: { not: "RETIRED" } },
    include: {
      model: true,
      bookings: { where: { status: { in: [...ACTIVE, "COMPLETED"] }, pickupAt: { lt: end }, returnAt: { gt: start } }, include: { customer: true }, orderBy: { pickupAt: "asc" } },
      blocks: { where: { startAt: { lt: end }, endAt: { gt: start } } },
    },
    orderBy: [{ model: { sortOrder: "asc" } }, { plate: "asc" }],
  });
  return { start, end, vehicles };
}

export async function manualBooking(input: {
  modelSlug: string; pickupAt: Date; returnAt: Date; pickupLocation: string; returnLocation: string; deliveryZone?: string | null;
  extras: { code: string; quantity: number }[]; customer: CustomerInput; locale: string;
}) {
  await requireAdmin();
  const h = await createHold({ ...input, source: "admin", allowImmediate: true });
  return confirmHold(h.ref, h.token, input.customer, "pay_on_pickup");
}

export async function fleetOverview() {
  await connection();
  await requireAdmin();
  const [vehicles, board, blocks] = await Promise.all([
    db.vehicle.findMany({ where: { status: { not: "RETIRED" } }, include: { model: true }, orderBy: [{ model: { sortOrder: "asc" } }, { plate: "asc" }] }),
    fleetStatusNow(),
    db.vehicleBlock.findMany({ where: { endAt: { gt: new Date() } }, include: { vehicle: true }, orderBy: { startAt: "asc" } }),
  ]);
  return { vehicles, board, blocks };
}

export async function bookingFormData() {
  await connection();
  await requireAdmin();
  const [models, locations, extras] = await Promise.all([
    db.vehicleModel.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }], include: { _count: { select: { vehicles: { where: { status: "ACTIVE" } } } } } }),
    db.location.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.extra.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return { models, locations, extras };
}
