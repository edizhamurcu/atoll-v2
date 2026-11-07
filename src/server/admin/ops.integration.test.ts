import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Session is checked inside ops (DAL); tests run as an authenticated owner.
vi.mock("./auth", () => ({ requireAdmin: async () => ({ id: "test", email: "t@t", name: "T", role: "owner" }) }));
import { db } from "@/lib/db";
import { createBlock, manualBooking, reassignVehicle, setStatus } from "./ops";
import { createHold } from "../booking";

const T = (s: string) => new Date(s);
const base = { modelSlug: "m", pickupAt: T("2027-08-01T10:00:00+03:00"), returnAt: T("2027-08-04T10:00:00+03:00"), pickupLocation: "o", returnLocation: "o", extras: [] };
const cust = { email: "a@b.co", firstName: "A", lastName: "B", phone: "+44 7000 000000" };

async function reset() {
  await db.auditLog.deleteMany(); await db.bookingExtra.deleteMany(); await db.booking.deleteMany(); await db.vehicleBlock.deleteMany();
  await db.vehicle.deleteMany(); await db.vehicleModel.deleteMany(); await db.location.deleteMany(); await db.customer.deleteMany();
  await db.location.create({ data: { slug: "o", name: { en: "O" }, address: "x" } });
  const m = await db.vehicleModel.create({ data: { slug: "m", make: "T", model: "V", class: "ECONOMY", bodyType: "HATCHBACK", transmission: "AUTOMATIC", fuel: "PETROL", seats: 5, dailyRate: "30" } });
  await db.vehicle.createMany({ data: [{ modelId: m.id, plate: "AA1" }, { modelId: m.id, plate: "AA2" }] });
}

describe("admin ops", () => {
  beforeEach(reset);
  afterAll(() => db.$disconnect());

  it("manual booking confirms immediately and allows walk-in (no lead time)", async () => {
    const now = Date.now();
    const b = await manualBooking({ ...base, pickupAt: new Date(now + 10 * 60_000), returnAt: new Date(now + 2 * 86_400_000), customer: cust, locale: "en" });
    expect(b.status).toBe("CONFIRMED");
    expect(b.source).toBe("admin");
  });

  it("status transitions are enforced", async () => {
    const b = await manualBooking({ ...base, customer: cust, locale: "en" });
    await expect(setStatus(b.ref, "PENDING_PAYMENT")).rejects.toMatchObject({ code: "BAD_TRANSITION" });
    await setStatus(b.ref, "COMPLETED");
    await expect(setStatus(b.ref, "CANCELLED")).rejects.toMatchObject({ code: "BAD_TRANSITION" });
  });

  it("cancelling frees the car for new bookings", async () => {
    const a = await manualBooking({ ...base, customer: cust, locale: "en" });
    await manualBooking({ ...base, customer: cust, locale: "en" });
    await expect(createHold(base)).rejects.toMatchObject({ code: "SOLD_OUT" });
    await setStatus(a.ref, "CANCELLED");
    await expect(createHold(base)).resolves.toMatchObject({ status: "HOLD" });
  });

  it("reassign refuses an occupied car and accepts a free one", async () => {
    const a = await manualBooking({ ...base, customer: cust, locale: "en" });
    const b = await manualBooking({ ...base, customer: cust, locale: "en" });
    await expect(reassignVehicle(a.ref, b.vehicleId)).rejects.toMatchObject({ code: "OVERLAP" });
    await setStatus(b.ref, "CANCELLED");
    await expect(reassignVehicle(a.ref, b.vehicleId)).resolves.toMatchObject({ to: b.vehicleId });
  });

  it("block cannot overlap an active booking; free car can be blocked", async () => {
    const a = await manualBooking({ ...base, customer: cust, locale: "en" });
    await expect(createBlock(a.vehicleId, T("2027-08-02T00:00:00+03:00"), T("2027-08-02T12:00:00+03:00"), "service")).rejects.toMatchObject({ code: "OVERLAP" });
    const other = await db.vehicle.findFirstOrThrow({ where: { id: { not: a.vehicleId } } });
    await createBlock(other.id, T("2027-08-02T00:00:00+03:00"), T("2027-08-02T12:00:00+03:00"), "service");
    await expect(createHold(base)).rejects.toMatchObject({ code: "SOLD_OUT" }); // one booked, one blocked
  });
});
