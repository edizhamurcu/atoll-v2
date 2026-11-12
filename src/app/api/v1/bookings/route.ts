import { json, handleError, limit, parse, readJson } from "@/server/http";
import { quoteSchema } from "@/server/schemas";
import { createHold } from "@/server/booking";

/** Creates a HOLD on a concrete vehicle (auto-assigned). Returns ref + bearer token for the next steps. */
export async function POST(req: Request) {
  // A hold blocks a real car for holdMinutes; cap per IP so a few clients cannot hold the whole fleet.
  const limited = await limit(req, "hold", 6, 900);
  if (limited) return limited;
  try {
    const body = parse(quoteSchema, await readJson(req));
    const idem = req.headers.get("idempotency-key");
    const h = await createHold({ ...body, idempotencyKey: idem && /^[\w-]{8,64}$/.test(idem) ? idem : undefined, source: "web" });
    return json({ ref: h.ref, token: h.token, status: h.status, holdExpiresAt: h.holdExpiresAt, quote: h.quote }, 201);
  } catch (e) {
    return handleError(e);
  }
}
