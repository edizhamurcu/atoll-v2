import { describe, expect, it } from "vitest";
import { assistantRequestEmail, bookingEmail, contactEmail, type BookingMail } from "./email-templates";

const b: BookingMail = {
  ref: "ATL-ABC123", status: "CONFIRMED", paymentMode: "pay_on_pickup", paymentStatus: "NONE", source: "web", locale: "tr",
  createdAt: new Date("2026-11-12T10:00:00Z"), confirmedAt: new Date("2026-11-12T10:00:00Z"),
  pickupAt: new Date("2026-12-05T08:00:00Z"), returnAt: new Date("2026-12-12T08:00:00Z"), days: 7,
  model: { make: "Mazda", model: "Carol", class: "ECONOMY", transmission: "AUTOMATIC", fuel: "PETROL", seats: 4 },
  vehicle: { plate: "ABC 123", year: 2019, color: "White" },
  pickupLocation: { name: "Office", address: "Alsancak" }, returnLocation: { name: "Office", address: "Alsancak" },
  deliveryZone: null, deliveryAddress: null, flightNumber: null, notes: "Child seat please",
  customer: { firstName: "Ali", lastName: "Veli", email: "ali@example.com", phone: "+90 533 000 00 00", country: "Turkey", licenseNumber: null },
  lines: [{ kind: "rental", label: "Car rental", quantity: 7, unit: "25.00", total: "175.00" }, { kind: "extra", label: "Baby seat", quantity: 7, unit: "2.00", total: "14.00" }],
  totals: { rental: "175.00", discount: "0.00", extras: "14.00", fees: "0.00", grand: "189.00", deposit: "0.00" },
};

describe("staff e-mails (English, full details)", () => {
  it("booking: subject and every key detail, in English, local time", () => {
    const m = bookingEmail(b, "NEW");
    expect(m.subject).toBe("[New booking] ATL-ABC123 – Mazda Carol – 05 Dec 10:00 to 12 Dec 10:00 – £189.00");
    for (const s of ["Reference", "Confirmed", "ABC 123, 2019, White", "Sat 05 Dec 2026, 10:00", "7 days", "Baby seat (7 × £2.00)", "£14.00", "TOTAL", "£189.00", "To collect at pick-up", "Ali Veli", "+90 533 000 00 00", "Turkish", "Child seat please", "/admin/bookings/ATL-ABC123"])
      expect(m.text).toContain(s);
    expect(m.replyTo).toBe("ali@example.com");
  });
  it("deposit paid: balance at pick-up is total minus deposit", () => {
    const m = bookingEmail({ ...b, paymentMode: "deposit", paymentStatus: "PAID", totals: { ...b.totals, deposit: "30.00" } }, "DEPOSIT_PAID");
    expect(m.subject.startsWith("[Deposit paid]")).toBe(true);
    expect(m.text).toMatch(/To collect at pick-up\s+: £159\.00/);
    expect(m.text).toContain("£30.00 (paid online)");
  });
  it("contact and assistant request mails", () => {
    const c = contactEmail({ name: "X", email: "x@example.com", topic: "Delivery", subject: null, message: "Hi", locale: "ru", createdAt: new Date() });
    expect(c.subject).toBe("[Contact form] Delivery – X");
    expect(c.text).toContain("Russian");
    const r = assistantRequestEmail({ id: "r1", kind: "TEST_DRIVE", name: "Y", phone: "+90 533 111 22 33", email: null, preferred: "Sat", details: "BMW X6", locale: "tr", confirmedAt: new Date(), page: "/tr", sessionId: "a".repeat(32), transcript: [{ role: "user", text: "test drive", at: new Date() }] });
    expect(r.subject).toBe("[Website assistant] OSK Auto – test drive request – Y – +90 533 111 22 33");
    expect(r.text).toContain("https://wa.me/905331112233");
    expect(r.text).toContain("Customer: test drive");
  });
});
