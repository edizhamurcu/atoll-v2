import "server-only";
import { db } from "@/lib/db";
import { t } from "@/server/catalog";
import { notifyStaff } from "@/server/mail";
import type { Quote } from "@/server/pricing";
import { bookingEmail, type BookingMail } from "@/server/email-templates";

/** Collects everything about a booking for the staff e-mail. */
export async function bookingMailData(bookingId: string): Promise<BookingMail | null> {
  const b = await db.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true, model: true, vehicle: true, pickupLocation: true, returnLocation: true, deliveryZone: true, extras: { include: { extra: true } } },
  });
  if (!b) return null;
  const q = b.priceBreakdown as unknown as Partial<Quote> | null;
  const extraName = new Map(b.extras.map((x) => [x.extra.code, t(x.extra.name, "en")]));
  return {
    ref: b.ref, status: b.status, paymentMode: b.paymentMode, paymentStatus: b.paymentStatus, source: b.source, locale: b.locale,
    createdAt: b.createdAt, confirmedAt: b.confirmedAt, pickupAt: b.pickupAt, returnAt: b.returnAt, days: b.days,
    model: { make: b.model.make, model: b.model.model, class: b.model.class, transmission: b.model.transmission, fuel: b.model.fuel, seats: b.model.seats },
    vehicle: b.vehicle ? { plate: b.vehicle.plate, year: b.vehicle.year, color: b.vehicle.color } : null,
    pickupLocation: { name: t(b.pickupLocation.name, "en"), address: b.pickupLocation.address },
    returnLocation: { name: t(b.returnLocation.name, "en"), address: b.returnLocation.address },
    deliveryZone: b.deliveryZone?.name ?? null, deliveryAddress: b.deliveryAddress, flightNumber: b.flightNumber, notes: b.notes,
    customer: b.customer ? { firstName: b.customer.firstName, lastName: b.customer.lastName, email: b.customer.email, phone: b.customer.phone, country: b.customer.country, licenseNumber: b.customer.licenseNumber } : null,
    lines: (q?.lines ?? []).map((l) => ({ kind: l.kind, label: l.kind === "extra" ? extraName.get(l.code) ?? l.label : l.label, quantity: l.quantity, unit: l.unit, total: l.total })),
    totals: { rental: b.rentalTotal.toFixed(2), discount: b.discountTotal.toFixed(2), extras: b.extrasTotal.toFixed(2), fees: b.feesTotal.toFixed(2), grand: b.grandTotal.toFixed(2), deposit: b.depositAmount.toFixed(2) },
    campaignFreeDays: q?.campaignFreeDays ?? 0,
    discountPercent: q?.discountPercent,
  };
}

/** Staff e-mail for a booking (new online booking, or deposit paid). Never throws. */
export async function notifyBooking(bookingId: string, event: "NEW" | "DEPOSIT_PAID") {
  try {
    const d = await bookingMailData(bookingId);
    return d ? await notifyStaff(bookingEmail(d, event)) : false;
  } catch (e) {
    console.error("[notify] booking", bookingId, e instanceof Error ? e.message : e);
    return false;
  }
}
