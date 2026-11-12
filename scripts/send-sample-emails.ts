/**
 * Sends one SAMPLE of every staff e-mail (booking, deposit paid, contact form, assistant request) to NOTIFY_EMAILS.
 * Usage (server): docker compose --profile tools run --rm tools npx tsx scripts/send-sample-emails.ts [--only=deposit,contact,assistant]
 * Uses the same templates and SMTP settings as the app. All data below is made up and marked SAMPLE.
 */
import "dotenv/config";
import nodemailer from "nodemailer";
import { assistantRequestEmail, bookingEmail, contactEmail, type BookingMail } from "../src/server/email-templates";

const now = new Date();
const at = (days: number, h: number) => { const d = new Date(now); d.setUTCDate(d.getUTCDate() + days); d.setUTCHours(h - 2, 0, 0, 0); return d; };

const booking: BookingMail = {
  ref: "ATL-SAMPLE01", status: "CONFIRMED", paymentMode: "pay_on_pickup", paymentStatus: "NONE", source: "web", locale: "de",
  createdAt: now, confirmedAt: now, pickupAt: at(10, 10), returnAt: at(17, 10), days: 7,
  model: { make: "Mazda", model: "Carol", class: "ECONOMY", transmission: "AUTOMATIC", fuel: "PETROL", seats: 4 },
  vehicle: { plate: "SAMPLE 123", year: 2019, color: "White" },
  pickupLocation: { name: "Alsancak (Kyrenia) office", address: "157 Karaoğlanoğlu Caddesi, Alsancak" },
  returnLocation: { name: "Ercan Airport", address: "Ercan Airport arrivals" },
  deliveryZone: null, deliveryAddress: null, flightNumber: "PC 1234",
  notes: "SAMPLE – not a real booking. Customer asks for a child seat installed before arrival.",
  customer: { firstName: "Sample", lastName: "Customer", email: "sample.customer@example.com", phone: "+49 151 0000 0000", country: "Germany", licenseNumber: "B072RRE2I55" },
  lines: [
    { kind: "rental", label: "Car rental", quantity: 7, unit: "25.00", total: "175.00" },
    { kind: "extra", label: "Baby seat", quantity: 7, unit: "2.00", total: "14.00" },
  ],
  totals: { rental: "175.00", discount: "0.00", extras: "14.00", fees: "0.00", grand: "189.00", deposit: "0.00" },
};
const deposit: BookingMail = { ...booking, ref: "ATL-SAMPLE02", status: "CONFIRMED", paymentMode: "deposit", paymentStatus: "PAID", totals: { ...booking.totals, deposit: "30.00" } };

const all = [
  bookingEmail(booking, "NEW"),
  bookingEmail(deposit, "DEPOSIT_PAID"),
  contactEmail({ name: "Sample Visitor", email: "sample.visitor@example.com", topic: "Long-term rental", subject: "SAMPLE – monthly rental in winter", message: "SAMPLE – not a real message.\n\nHello, we need an SUV from 1 to 31 January. What would the price be?", locale: "en", createdAt: now }),
  assistantRequestEmail({
    id: "sample", kind: "TEST_DRIVE", name: "Sample Buyer", phone: "+90 533 000 00 00", email: null, preferred: "Saturday afternoon", locale: "tr", confirmedAt: now, page: "/tr/car-sales", sessionId: "0".repeat(32),
    details: "SAMPLE – BMW X6 test drive on Saturday afternoon",
    transcript: [
      { role: "user", text: "BMW X6 için test sürüşü istiyorum. (SAMPLE)", at: now },
      { role: "assistant", text: "Test sürüşü talebinizin taslağını hazırladım; bilgileri kontrol edip onaylayın.", at: now },
    ],
  }),
];

const KEYS = ["booking", "deposit", "contact", "assistant"];
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const mails = all.filter((_, i) => !only || only.includes(KEYS[i]));

async function main() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFY_EMAILS } = process.env;
  if (!SMTP_HOST || !SMTP_FROM || !NOTIFY_EMAILS) throw new Error("SMTP_HOST, SMTP_FROM and NOTIFY_EMAILS are required");
  const port = Number(SMTP_PORT ?? 587);
  const hosts = [...(process.env.SMTP_CONNECT_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean), SMTP_HOST];
  for (const m of mails) {
    let ok = false;
    for (const host of hosts) {
      const tx = nodemailer.createTransport({ host, port, secure: port === 465, requireTLS: process.env.SMTP_REQUIRE_TLS === "true", auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined, tls: { servername: SMTP_HOST } });
      try {
        const r = await tx.sendMail({ from: { name: "Atoll Rent A Car", address: SMTP_FROM }, to: NOTIFY_EMAILS, subject: `[SAMPLE] ${m.subject}`, text: m.text, replyTo: m.replyTo });
        console.log("sent via", host, ":", m.subject.slice(0, 60), "->", r.accepted.length, "accepted");
        ok = true;
        break;
      } catch (e) {
        console.log("retry, failed via", host, ":", e instanceof Error ? e.message : e);
      }
    }
    if (!ok) throw new Error(`could not send: ${m.subject}`);
  }
}
main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
