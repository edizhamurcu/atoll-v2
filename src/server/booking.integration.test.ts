import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createHold, confirmHold, BookingError } from "./booking";
import { availabilityByModel, fleetStatusNow } from "./availability";

const T = (s: string) => new Date(s);
const pickupAt = T("2027-07-01T10:00:00+03:00");
const returnAt = T("2027-07-05T10:00:00+03:00");
const base = { modelSlug: "test-vitz", pickupAt, returnAt, pickupLocation: "test-office", returnLocation: "test-office", extras: [] as { code: string; quantity: number }[] };

async function reset(vehicles: number) {
  await db.bookingExtra.deleteMany();
  await db.booking.deleteMany();
  await db.vehicleBlock.deleteMany();
  await db.vehicle.deleteMany();
  await db.seasonRate.deleteMany();
  await db.vehicleModel.deleteMany();
  await db.location.deleteMany();
  await db.extra.deleteMany();
  await db.setting.deleteMany();
  await db.location.create({ data: { slug: "test-office", name: { en: "Office" }, address: "x" } });
  await db.extra.create({ data: { code: "baby_seat", name: { en: "Baby seat" }, pricing: "PER_DAY", price: "3", maxQty: 2 } });
  const model = await db.vehicleModel.create({
    data: { slug: "test-vitz", make: "Toyota", model: "Vitz", class: "ECONOMY", bodyType: "HATCHBACK", transmission: "AUTOMATIC", fuel: "PETROL", seats: 5, dailyRate: "30" },
  });
  for (let i = 0; i < vehicles; i++) await db.vehicle.create({ data: { modelId: model.id, plate: `TST${i}` } });
  return model;
}

describe("booking engine (real Postgres)", () => {
  beforeEach(async () => {
    await reset(2);
  });
  afterAll(async () => {
    await db.$disconnect();
  });

  it("10 concurrent holds on 2 cars -> exactly 2 succeed, no overlap", async () => {
    const results = await Promise.allSettled(Array.from({ length: 10 }, () => createHold(base)));
    const ok = results.filter((r) => r.status === "fulfilled");
    const soldOut = results.filter((r) => r.status === "rejected" && (r.reason as BookingError).code === "SOLD_OUT");
    expect(ok.length).toBe(2);
    expect(soldOut.length).toBe(8);
    const rows = await db.booking.findMany({ where: { status: "HOLD" } });
    expect(new Set(rows.map((r) => r.vehicleId)).size).toBe(2);
  });

  it("availability reflects holds and turnaround buffer", async () => {
    await reset(1);
    await createHold(base);
    const m = await db.vehicleModel.findFirstOrThrow();
    // Next pickup 1h after return -> inside 2h buffer -> unavailable
    const a1 = await availabilityByModel({ start: T("2027-07-05T11:00:00+03:00"), end: T("2027-07-08T12:00:00+03:00") });
    expect(a1.get(m.id)).toEqual({ total: 1, available: 0 });
    // 2h after return -> free
    const a2 = await availabilityByModel({ start: T("2027-07-05T12:00:00+03:00"), end: T("2027-07-08T12:00:00+03:00") });
    expect(a2.get(m.id)).toEqual({ total: 1, available: 1 });
    // Booking ending exactly when buffer of a later booking starts: earlier window [.., pickup) is free
    const a3 = await availabilityByModel({ start: T("2027-06-28T10:00:00+03:00"), end: T("2027-07-01T10:00:00+03:00") });
    expect(a3.get(m.id)?.available).toBe(1);
  });

  it("expired holds release the car", async () => {
    await reset(1);
    const h = await createHold(base);
    await expect(createHold(base)).rejects.toMatchObject({ code: "SOLD_OUT" });
    await db.booking.update({ where: { id: h.id }, data: { holdExpiresAt: new Date(Date.now() - 1000) } });
    const h2 = await createHold(base);
    expect(h2.ref).not.toBe(h.ref);
    expect((await db.booking.findUniqueOrThrow({ where: { id: h.id } })).status).toBe("EXPIRED");
  });

  it("maintenance block makes the car unavailable", async () => {
    await reset(1);
    const v = await db.vehicle.findFirstOrThrow();
    await db.vehicleBlock.create({ data: { vehicleId: v.id, startAt: T("2027-07-03T00:00:00+03:00"), endAt: T("2027-07-04T00:00:00+03:00"), reason: "service" } });
    await expect(createHold(base)).rejects.toMatchObject({ code: "SOLD_OUT" });
  });

  it("DB exclusion constraint rejects a direct overlapping insert", async () => {
    await reset(1);
    const h = await createHold(base);
    const b = await db.booking.findUniqueOrThrow({ where: { id: h.id } });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ref: _ref, idempotencyKey: _k, stripeSessionId: _s, legacyWpOrderId: _l, createdAt: _c, updatedAt: _u, priceBreakdown, ...rest } = b;
    await expect(db.booking.create({ data: { ...rest, priceBreakdown: priceBreakdown as object, ref: "ATL-DUPE01" } })).rejects.toThrow(/booking_no_overlap|23P01|exclusion/i);
  });

  it("confirm: pay on pickup confirms; token required; double confirm rejected", async () => {
    const h = await createHold({ ...base, extras: [{ code: "baby_seat", quantity: 1 }] });
    expect(h.quote.grandTotal).toBe("132.00"); // 4 days*30 + 4*3
    const cust = { email: "Guest@Example.com", firstName: "A", lastName: "B", phone: "+44 7000 000000" };
    await expect(confirmHold(h.ref, "wrong-token", cust, "pay_on_pickup")).rejects.toMatchObject({ code: "NOT_FOUND" });
    const c = await confirmHold(h.ref, h.token, cust, "pay_on_pickup");
    expect(c.status).toBe("CONFIRMED");
    expect(c.customer?.email).toBe("guest@example.com");
    await expect(confirmHold(h.ref, h.token, cust, "pay_on_pickup")).rejects.toMatchObject({ code: "NOT_HOLD" });
  });

  it("idempotency key prevents duplicate holds", async () => {
    await createHold({ ...base, idempotencyKey: "abc-123" });
    await expect(createHold({ ...base, idempotencyKey: "abc-123" })).rejects.toMatchObject({ code: "IDEMPOTENT_REPLAY" });
  });

  it("rejects past/lead-time pickups and reversed ranges", async () => {
    await expect(createHold({ ...base, pickupAt: new Date(Date.now() + 30 * 60_000), returnAt: new Date(Date.now() + 2 * 86_400_000) })).rejects.toMatchObject({ code: "LEAD_TIME" });
    await expect(createHold({ ...base, returnAt: pickupAt })).rejects.toMatchObject({ code: "INVALID_RANGE" });
  });

  it("fleet board shows on_rent during an active confirmed booking", async () => {
    await reset(1);
    const v = await db.vehicle.findFirstOrThrow();
    const m = await db.vehicleModel.findFirstOrThrow();
    const loc = await db.location.findFirstOrThrow();
    const now = Date.now();
    await db.booking.create({
      data: {
        ref: "ATL-LIVE01", status: "CONFIRMED", modelId: m.id, vehicleId: v.id, pickupLocationId: loc.id, returnLocationId: loc.id,
        pickupAt: new Date(now - 86_400_000), returnAt: new Date(now + 86_400_000), blockedUntil: new Date(now + 86_400_000 + 7_200_000),
        days: 2, rentalTotal: "60", grandTotal: "60", priceBreakdown: {}, accessTokenHash: "x",
      },
    });
    const board = await fleetStatusNow();
    expect(board[0]).toMatchObject({ plate: "TST0", state: "on_rent", currentBooking: { ref: "ATL-LIVE01" } });
  });
});
