import { db } from "@/lib/db";
import { stripe, stripeEnabled } from "@/server/payments";
import { markDepositPaid } from "@/server/booking";
import { notifyBooking } from "@/server/notify";

/** Stripe → deposit confirmation. Signature-verified, idempotent. */
export async function POST(req: Request) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) return new Response("disabled", { status: 404 });
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, sig ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("bad signature", { status: 400 });
  }
  if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
    const s = event.data.object;
    const bookingId = s.metadata?.bookingId;
    if (bookingId) {
      try {
        const r = await markDepositPaid(bookingId, s.id);
        if (r.count === 0) console.warn("[stripe] deposit for non-pending booking", bookingId);
        else await notifyBooking(bookingId, "DEPOSIT_PAID");
      } catch (e) {
        // Paid after the hold expired and the car was taken: flag for staff (refund or reassign).
        console.error("[stripe] could not confirm paid booking", bookingId, e instanceof Error ? e.message : e);
        await db.booking.update({ where: { id: bookingId }, data: { paymentStatus: "PAID", stripeSessionId: s.id, notes: "PAID AFTER HOLD EXPIRED — vehicle conflict, needs manual reassignment/refund" } });
      }
    }
  }
  if (event.type === "checkout.session.expired") {
    const bookingId = event.data.object.metadata?.bookingId;
    if (bookingId) await db.booking.updateMany({ where: { id: bookingId, status: "PENDING_PAYMENT" }, data: { status: "EXPIRED" } });
  }
  return new Response("ok");
}
