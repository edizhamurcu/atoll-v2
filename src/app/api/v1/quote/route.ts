import { json, handleError, limit, parse, readJson } from "@/server/http";
import { quoteSchema } from "@/server/schemas";
import { buildQuote } from "@/server/booking";
import { stripeEnabled } from "@/server/payments";

export async function POST(req: Request) {
  const limited = await limit(req, "quote", 120, 60);
  if (limited) return limited;
  try {
    const q = parse(quoteSchema, await readJson(req));
    const { quote } = await buildQuote(q);
    return json({ quote, currency: "GBP", depositAvailable: stripeEnabled() });
  } catch (e) {
    return handleError(e);
  }
}
