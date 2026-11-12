import "server-only";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db";
import { BUSINESS_TZ } from "@/lib/contact";
import { SITE } from "@/lib/site";
import { t } from "@/server/catalog";
import { notifyStaff } from "@/server/mail";

const when = (d: Date) => formatInTimeZone(d, BUSINESS_TZ, "dd.MM.yyyy HH:mm");

/** Staff e-mail for a booking (new online booking, or deposit paid). Never throws. */
export async function notifyBooking(bookingId: string, event: "NEW" | "DEPOSIT_PAID") {
  try {
    const b = await db.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, model: true, pickupLocation: true, returnLocation: true, deliveryZone: true, extras: { include: { extra: true } } },
    });
    if (!b) return false;
    const c = b.customer;
    const head = event === "DEPOSIT_PAID" ? "Depozito ödendi / Deposit paid" : b.status === "PENDING_PAYMENT" ? "Yeni rezervasyon – depozito bekleniyor / New booking – awaiting deposit" : "Yeni rezervasyon / New booking";
    const lines = [
      `${head}: ${b.ref}`,
      "",
      `Araç / Car: ${b.model.make} ${b.model.model}`,
      `Alış / Pick-up: ${when(b.pickupAt)} – ${t(b.pickupLocation.name, "tr")}`,
      `İade / Return: ${when(b.returnAt)} – ${t(b.returnLocation.name, "tr")}`,
      b.deliveryZone ? `Teslimat / Delivery: ${b.deliveryZone.name}${b.deliveryAddress ? ` – ${b.deliveryAddress}` : ""}` : null,
      b.extras.length ? `Ekstralar / Extras: ${b.extras.map((x) => `${t(x.extra.name, "tr")} × ${x.quantity}`).join(", ")}` : null,
      `Toplam / Total: £${b.grandTotal.toFixed(2)} (ödeme / payment: ${b.paymentMode === "deposit" ? "depozito online" : "teslimde"})`,
      "",
      c ? `Müşteri / Customer: ${c.firstName} ${c.lastName}` : null,
      c ? `Telefon / Phone: ${c.phone}` : null,
      c ? `E-posta / E-mail: ${c.email}` : null,
      c?.country ? `Ülke / Country: ${c.country}` : null,
      b.flightNumber ? `Uçuş / Flight: ${b.flightNumber}` : null,
      b.notes ? `\nNot / Notes:\n${b.notes}` : null,
      "",
      `Yönetim / Admin: ${SITE.url.replace(/\/$/, "")}/admin/bookings/${b.ref}`,
    ].filter((l) => l !== null);
    return await notifyStaff({ subject: `${SITE.name} ${head}: ${b.ref} – ${b.model.make} ${b.model.model}`, text: lines.join("\n"), replyTo: c?.email });
  } catch (e) {
    console.error("[notify] booking", bookingId, e instanceof Error ? e.message : e);
    return false;
  }
}
