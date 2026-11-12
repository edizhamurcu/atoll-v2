/**
 * Staff notification e-mails (English, plain text). Pure functions: no database, no network,
 * so they are unit-tested and the sample script can render them with made-up data.
 */
import { formatInTimeZone } from "date-fns-tz";

const TZ = process.env.BUSINESS_TZ ?? "Asia/Famagusta";
const SITE_URL = (process.env.PUBLIC_SITE_URL ?? "https://atollrentacar.com").replace(/\/$/, "");
export const fmtDate = (d: Date) => formatInTimeZone(d, TZ, "EEE dd MMM yyyy, HH:mm");
const gbp = (v: string | number) => `£${Number(v).toFixed(2)}`;
const LANG: Record<string, string> = { en: "English", tr: "Turkish", de: "German", ru: "Russian" };

/** "Label ......: value" rows; empty values are skipped. */
function rows(pairs: [string, string | number | null | undefined][]) {
  const shown = pairs.filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "");
  const w = Math.max(...shown.map(([k]) => k.length));
  return shown.map(([k, v]) => `${k.padEnd(w)} : ${String(v).replace(/\n/g, `\n${" ".repeat(w + 3)}`)}`).join("\n");
}
const section = (title: string, body: string) => `${title.toUpperCase()}\n${"-".repeat(title.length)}\n${body}`;
const footer = (lines: string[]) => `\n--\n${lines.join("\n")}\nTimes are North Cyprus time (${TZ}). This e-mail was sent automatically by ${SITE_URL}.`;

/* ---------------- bookings ---------------- */

export type BookingMail = {
  ref: string;
  status: string;
  paymentMode: string;
  paymentStatus: string;
  source: string;
  locale: string;
  createdAt: Date;
  confirmedAt: Date | null;
  pickupAt: Date;
  returnAt: Date;
  days: number;
  model: { make: string; model: string; class: string; transmission: string; fuel: string; seats: number };
  vehicle: { plate: string; year: number | null; color: string | null } | null;
  pickupLocation: { name: string; address: string };
  returnLocation: { name: string; address: string };
  deliveryZone: string | null;
  deliveryAddress: string | null;
  flightNumber: string | null;
  notes: string | null;
  customer: { firstName: string; lastName: string; email: string; phone: string; country: string | null; licenseNumber: string | null } | null;
  lines: { kind: string; label: string; quantity: number; unit: string; total: string }[];
  totals: { rental: string; discount: string; extras: string; fees: string; grand: string; deposit: string };
  campaignFreeDays?: number;
  discountPercent?: string;
};

const STATUS: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PENDING_PAYMENT: "Awaiting online deposit payment",
  HOLD: "On hold (not confirmed yet)",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
};

export function bookingEmail(b: BookingMail, event: "NEW" | "DEPOSIT_PAID") {
  const car = `${b.model.make} ${b.model.model}`;
  const headline = event === "DEPOSIT_PAID" ? "Deposit paid" : b.status === "PENDING_PAYMENT" ? "New booking – awaiting deposit" : "New booking";
  const depositPaid = b.paymentStatus === "PAID";
  const payAtPickup = depositPaid ? Number(b.totals.grand) - Number(b.totals.deposit) : Number(b.totals.grand);
  const priceLines = b.lines.length
    ? b.lines.map((l) => `  ${l.label}${l.quantity > 1 || l.kind === "extra" ? ` (${l.quantity} × ${gbp(l.unit)})` : ""}`.padEnd(46) + gbp(l.total).padStart(12)).join("\n")
    : "";
  const subject = `[${headline}] ${b.ref} – ${car} – ${formatInTimeZone(b.pickupAt, TZ, "dd MMM HH:mm")} to ${formatInTimeZone(b.returnAt, TZ, "dd MMM HH:mm")} – ${gbp(b.totals.grand)}`;
  const text = [
    `${headline}: ${b.ref}`,
    "",
    section("Booking", rows([
      ["Reference", b.ref],
      ["Status", STATUS[b.status] ?? b.status],
      ["Booked at", fmtDate(b.createdAt)],
      ["Confirmed at", b.confirmedAt ? fmtDate(b.confirmedAt) : null],
      ["Booked via", b.source === "web" ? "Website" : b.source],
      ["Customer language", LANG[b.locale] ?? b.locale],
    ])),
    "",
    section("Vehicle", rows([
      ["Model", car],
      ["Class", b.model.class.replace(/_/g, " ").toLowerCase()],
      ["Gearbox / fuel", `${b.model.transmission.toLowerCase()} / ${b.model.fuel.toLowerCase()}`],
      ["Seats", b.model.seats],
      ["Assigned car", b.vehicle ? [b.vehicle.plate, b.vehicle.year, b.vehicle.color].filter(Boolean).join(", ") : null],
    ])),
    "",
    section("Rental period", rows([
      ["Pick-up", `${fmtDate(b.pickupAt)}\n${b.pickupLocation.name} – ${b.pickupLocation.address}`],
      ["Return", `${fmtDate(b.returnAt)}\n${b.returnLocation.name} – ${b.returnLocation.address}`],
      ["Duration", `${b.days} day${b.days === 1 ? "" : "s"}`],
      ["Delivery", b.deliveryZone ? `${b.deliveryZone}${b.deliveryAddress ? ` – ${b.deliveryAddress}` : ""}` : null],
      ["Flight number", b.flightNumber],
    ])),
    "",
    section("Price (GBP)", [
      priceLines,
      priceLines ? `  ${"".padEnd(44, "-")}${"".padStart(12, "-")}` : "",
      rows([
        ["  Rental", gbp(b.totals.rental)],
        ["  Discount", Number(b.totals.discount) ? `-${gbp(b.totals.discount)}${b.campaignFreeDays ? ` (campaign: ${b.campaignFreeDays} day${b.campaignFreeDays > 1 ? "s" : ""} free)` : b.discountPercent && Number(b.discountPercent) ? ` (${b.discountPercent}%)` : ""}` : null],
        ["  Extras", Number(b.totals.extras) ? gbp(b.totals.extras) : null],
        ["  Fees / delivery", Number(b.totals.fees) ? gbp(b.totals.fees) : null],
        ["  TOTAL", gbp(b.totals.grand)],
        ["  Deposit", Number(b.totals.deposit) ? `${gbp(b.totals.deposit)} (${depositPaid ? "paid online" : b.paymentMode === "deposit" ? "to be paid online" : "not taken online"})` : null],
        ["  To collect at pick-up", gbp(payAtPickup)],
        ["  Payment method", b.paymentMode === "deposit" ? "Online deposit, balance at pick-up" : "Pay at pick-up (cash or card)"],
      ]),
    ].filter(Boolean).join("\n")),
    "",
    section("Customer", b.customer ? rows([
      ["Name", `${b.customer.firstName} ${b.customer.lastName}`],
      ["Phone", b.customer.phone],
      ["E-mail", b.customer.email],
      ["Country", b.customer.country],
      ["Driving licence", b.customer.licenseNumber],
    ]) : "No customer details yet"),
    ...(b.notes ? ["", section("Customer notes", b.notes)] : []),
    footer([
      `Open in admin: ${SITE_URL}/admin/bookings/${b.ref}`,
      b.customer ? `Reply to this e-mail to write to the customer (${b.customer.email}).` : "",
    ].filter(Boolean)),
  ].join("\n");
  return { subject, text, replyTo: b.customer?.email };
}

/* ---------------- contact form ---------------- */

export type ContactMail = { name: string; email: string; topic: string | null; subject: string | null; message: string | null; locale: string; createdAt: Date; page?: string | null };

export function contactEmail(c: ContactMail) {
  const subject = `[Contact form] ${c.topic ?? c.subject ?? "Message"} – ${c.name}`;
  const text = [
    `New message from the contact form`,
    "",
    section("From", rows([["Name", c.name], ["E-mail", c.email], ["Language", LANG[c.locale] ?? c.locale], ["Received", fmtDate(c.createdAt)]])),
    "",
    section("Message", rows([["Topic", c.topic], ["Subject", c.subject]]) + `\n\n${c.message?.trim() || "(no message text)"}`),
    footer([`Reply to this e-mail to answer ${c.name} (${c.email}).`, `All messages: ${SITE_URL}/admin`]),
  ].join("\n");
  return { subject, text, replyTo: c.email };
}

/* ---------------- assistant requests ---------------- */

export const REQUEST_KIND: Record<string, string> = {
  HANDOFF: "Customer wants to talk to the team",
  RENTAL_CALLBACK: "Rental – call the customer back",
  SALES_INQUIRY: "OSK Auto – car sales inquiry",
  TEST_DRIVE: "OSK Auto – test drive request",
  SERVICE_APPOINTMENT: "OSK Auto – service appointment request",
};

export type AssistantRequestMail = {
  id: string; kind: string; name: string; phone: string; email: string | null; preferred: string | null; details: string; locale: string;
  confirmedAt: Date; page: string | null; transcript: { role: string; text: string; at: Date }[]; sessionId: string;
};

export function assistantRequestEmail(r: AssistantRequestMail) {
  const kind = REQUEST_KIND[r.kind] ?? r.kind;
  const subject = `[Website assistant] ${kind} – ${r.name} – ${r.phone}`;
  const convo = r.transcript.length
    ? r.transcript.map((m) => `[${formatInTimeZone(m.at, TZ, "HH:mm")}] ${m.role === "user" ? "Customer" : "Assistant"}: ${m.text.trim()}`).join("\n\n")
    : "(no messages)";
  const text = [
    `${kind}`,
    "The customer confirmed this request in the website's AI assistant. Please contact them.",
    "",
    section("Customer", rows([["Name", r.name], ["Phone / WhatsApp", r.phone], ["E-mail", r.email], ["Preferred time", r.preferred], ["Language", LANG[r.locale] ?? r.locale]])),
    "",
    section("Request", r.details),
    "",
    section("Details", rows([["Type", kind], ["Confirmed at", fmtDate(r.confirmedAt)], ["Started on page", r.page], ["Request id", r.id]])),
    "",
    section("Conversation", convo),
    footer([
      `Phone: tel:${r.phone.replace(/[^\d+]/g, "")}   WhatsApp: https://wa.me/${r.phone.replace(/\D/g, "")}`,
      `Mark as handled: ${SITE_URL}/admin/assistant   Conversation: ${SITE_URL}/admin/assistant/${r.sessionId}`,
      "Prices quoted by the assistant come from the booking system; the assistant cannot make bookings.",
    ]),
  ].join("\n");
  return { subject, text, replyTo: r.email ?? undefined };
}
