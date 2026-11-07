import { json, handleError, limit, parse, readJson } from "@/server/http";
import { confirmSchema } from "@/server/schemas";
import { confirmHold } from "@/server/booking";
import { startDepositCheckout, stripeEnabled } from "@/server/payments";

export async function POST(req: Request, ctx: RouteContext<"/api/v1/bookings/[ref]/confirm">) {
  const limited = await limit(req, "bk-confirm", 10, 600);
  if (limited) return limited;
  try {
    const { ref } = await ctx.params;
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const body = parse(confirmSchema, await readJson(req));
    const mode = body.paymentMode === "deposit" && stripeEnabled() ? "deposit" : "pay_on_pickup";
    const b = await confirmHold(ref, token, body.customer, mode);
    if (mode === "deposit") {
      const url = await startDepositCheckout(b);
      return json({ ref: b.ref, status: b.status, checkoutUrl: url });
    }
    return json({ ref: b.ref, status: b.status, checkoutUrl: null });
  } catch (e) {
    return handleError(e);
  }
}
