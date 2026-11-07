import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/** Statuses that occupy a vehicle. HOLD/PENDING_PAYMENT only while holdExpiresAt is in the future. */
const OCCUPYING_SQL = `(b.status = 'CONFIRMED' OR (b.status IN ('HOLD','PENDING_PAYMENT') AND b."holdExpiresAt" > now()))`;

type Tx = Prisma.TransactionClient | typeof db;

export interface Window {
  start: Date; // pickupAt
  end: Date; // returnAt + buffer
}

/** Vehicle ids that are free for the whole window (bookings incl. their buffer, and maintenance blocks). */
export async function freeVehicleIds(tx: Tx, modelIds: string[], w: Window, onlyIds?: string[]): Promise<{ id: string; modelId: string; homeLocationId: string | null }[]> {
  if (modelIds.length === 0) return [];
  return tx.$queryRawUnsafe(
    `SELECT v.id, v."modelId", v."homeLocationId"
       FROM "Vehicle" v
      WHERE v.status = 'ACTIVE'
        AND v."modelId" = ANY($1::text[])
        AND ($4::text[] IS NULL OR v.id = ANY($4::text[]))
        AND NOT EXISTS (
          SELECT 1 FROM "Booking" b
           WHERE b."vehicleId" = v.id AND ${OCCUPYING_SQL}
             AND tstzrange(b."pickupAt", b."blockedUntil", '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)'))
        AND NOT EXISTS (
          SELECT 1 FROM "VehicleBlock" k
           WHERE k."vehicleId" = v.id
             AND tstzrange(k."startAt", k."endAt", '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)'))`,
    modelIds,
    w.start,
    w.end,
    onlyIds ?? null,
  );
}

/** Per model: total active vehicles and how many are free for the window. */
export async function availabilityByModel(w: Window, modelIds?: string[]) {
  const models = await db.vehicleModel.findMany({
    where: { active: true, ...(modelIds ? { id: { in: modelIds } } : {}) },
    select: { id: true, _count: { select: { vehicles: { where: { status: "ACTIVE" } } } } },
  });
  const ids = models.map((m) => m.id);
  const free = await freeVehicleIds(db, ids, w);
  const freeCount = new Map<string, number>();
  for (const f of free) freeCount.set(f.modelId, (freeCount.get(f.modelId) ?? 0) + 1);
  return new Map(models.map((m) => [m.id, { total: m._count.vehicles, available: freeCount.get(m.id) ?? 0 }]));
}

/** Live fleet board: what every vehicle is doing right now and its next commitment. */
export async function fleetStatusNow() {
  const rows: {
    id: string; plate: string; modelId: string; status: string;
    current_ref: string | null; current_until: Date | null; next_ref: string | null; next_from: Date | null; blocked: boolean;
  }[] = await db.$queryRawUnsafe(`
    SELECT v.id, v.plate, v."modelId", v.status,
      cur.ref AS current_ref, cur."returnAt" AS current_until,
      nxt.ref AS next_ref, nxt."pickupAt" AS next_from,
      EXISTS (SELECT 1 FROM "VehicleBlock" k WHERE k."vehicleId" = v.id AND now() <@ tstzrange(k."startAt", k."endAt", '[)')) AS blocked
    FROM "Vehicle" v
    LEFT JOIN LATERAL (
      SELECT b.ref, b."returnAt" FROM "Booking" b
       WHERE b."vehicleId" = v.id AND ${OCCUPYING_SQL} AND now() <@ tstzrange(b."pickupAt", b."blockedUntil", '[)')
       LIMIT 1) cur ON true
    LEFT JOIN LATERAL (
      SELECT b.ref, b."pickupAt" FROM "Booking" b
       WHERE b."vehicleId" = v.id AND ${OCCUPYING_SQL} AND b."pickupAt" > now()
       ORDER BY b."pickupAt" LIMIT 1) nxt ON true
    WHERE v.status <> 'RETIRED'
    ORDER BY v.plate`);
  return rows.map((r) => ({
    vehicleId: r.id,
    plate: r.plate,
    modelId: r.modelId,
    state: r.status === "MAINTENANCE" || r.blocked ? "maintenance" : r.current_ref ? "on_rent" : "available",
    currentBooking: r.current_ref ? { ref: r.current_ref, until: r.current_until } : null,
    nextBooking: r.next_ref ? { ref: r.next_ref, from: r.next_from } : null,
  }));
}
