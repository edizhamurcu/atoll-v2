import { json, handleError, limit } from "@/server/http";
import { getBookingForCustomer } from "@/server/booking";
import { t, type Locale } from "@/server/catalog";
import { stripeEnabled } from "@/server/payments";

export async function GET(req: Request, ctx: RouteContext<"/api/v1/bookings/[ref]">) {
  const limited = await limit(req, "bk-get", 60, 60);
  if (limited) return limited;
  try {
    const { ref } = await ctx.params;
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const b = await getBookingForCustomer(ref, token);
    const locale = b.locale as Locale;
    return json({
      ref: b.ref, status: b.status, paymentMode: b.paymentMode, paymentStatus: b.paymentStatus,
      vehicle: { name: `${b.model.make} ${b.model.model}`, slug: b.model.slug, image: b.model.images[0] ?? null },
      pickup: { at: b.pickupAt, location: t(b.pickupLocation.name, locale), address: b.pickupLocation.address },
      return: { at: b.returnAt, location: t(b.returnLocation.name, locale), address: b.returnLocation.address },
      deliveryZone: b.deliveryZone?.name ?? null,
      days: b.days, holdExpiresAt: b.holdExpiresAt,
      totals: { grandTotal: b.grandTotal.toFixed(2), deposit: b.depositAmount.toFixed(2), currency: b.currency },
      depositAvailable: stripeEnabled(),
      breakdown: b.priceBreakdown,
      extras: b.extras.map((e) => ({ code: e.extra.code, name: t(e.extra.name, locale), quantity: e.quantity, total: e.total.toFixed(2) })),
      customer: b.customer ? { firstName: b.customer.firstName, lastName: b.customer.lastName, email: b.customer.email } : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return handleError(e);
  }
}
