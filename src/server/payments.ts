import "server-only";
import Stripe from "stripe";
import { db } from "@/lib/db";

let client: Stripe | null = null;
export const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
  return (client ??= new Stripe(process.env.STRIPE_SECRET_KEY));
}

const toMinor = (v: { toString(): string }) => Math.round(Number(v.toString()) * 100); // GBP pence; values are 2dp Decimals

/** Creates a Stripe Checkout session for the booking deposit. The rest is paid at pick-up. */
export async function startDepositCheckout(b: {
  id: string; ref: string; depositAmount: { toString(): string }; locale: string;
  customer: { email: string } | null; model: { make: string; model: string };
}) {
  const site = process.env.PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      customer_email: b.customer?.email,
      client_reference_id: b.id,
      metadata: { bookingId: b.id, ref: b.ref },
      payment_intent_data: { metadata: { bookingId: b.id, ref: b.ref }, description: `Atoll deposit ${b.ref}` },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: toMinor(b.depositAmount),
            product_data: { name: `Deposit — ${b.model.make} ${b.model.model} (${b.ref})` },
          },
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${site}/${b.locale}/booking/${b.ref}?paid=1`,
      cancel_url: `${site}/${b.locale}/booking/${b.ref}?cancelled=1`,
      locale: (["en", "tr", "de", "ru"].includes(b.locale) ? b.locale : "auto") as Stripe.Checkout.SessionCreateParams.Locale,
    },
    { idempotencyKey: `deposit-${b.id}` },
  );
  await db.booking.update({ where: { id: b.id }, data: { stripeSessionId: session.id } });
  return session.url;
}
