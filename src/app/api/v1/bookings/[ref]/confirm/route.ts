import { clientIp, json, handleError, limit, parse, readJson } from "@/server/http";
import { composeNotes, MIN_FILL_MS, spamError, spamReason, verifyTurnstile } from "@/server/antispam";
import { confirmSchema } from "@/server/schemas";
import { confirmHold } from "@/server/booking";
import { startDepositCheckout, stripeEnabled } from "@/server/payments";
import { after } from "next/server";
import { notifyBooking } from "@/server/notify";

export async function POST(req: Request, ctx: RouteContext<"/api/v1/bookings/[ref]/confirm">) {
  const limited = await limit(req, "bk-confirm", 10, 600);
  if (limited) return limited;
  try {
    const { ref } = await ctx.params;
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const body = parse(confirmSchema, await readJson(req));
    const { notesTopic, ...customer } = body.customer;
    const notes = composeNotes(notesTopic, customer.notes);
    const reason = body.website ? "honeypot" : spamReason({ ...customer, notes });
    if (reason) {
      console.warn("[antispam] blocked confirm", ref, reason);
      throw spamError();
    }
    if (!(await verifyTurnstile(body.captchaToken, clientIp(req)))) throw spamError();
    const mode = body.paymentMode === "deposit" && stripeEnabled() ? "deposit" : "pay_on_pickup";
    const b = await confirmHold(ref, token, { ...customer, notes }, mode, { minAgeMs: MIN_FILL_MS });
    // Staff e-mail after the response; mail problems never fail the booking.
    after(() => notifyBooking(b.id, "NEW"));
    if (mode === "deposit") {
      const url = await startDepositCheckout(b);
      return json({ ref: b.ref, status: b.status, checkoutUrl: url });
    }
    return json({ ref: b.ref, status: b.status, checkoutUrl: null });
  } catch (e) {
    return handleError(e);
  }
}
