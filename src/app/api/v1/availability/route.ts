import { json, handleError, limit, parse, problem } from "@/server/http";
import { searchSchema } from "@/server/schemas";
import { search } from "@/server/catalog";

/** GET /api/v1/availability?pickupAt=ISO&returnAt=ISO&pickupLocation=slug[&returnLocation][&deliveryZone][&class][&locale] */
export async function GET(req: Request) {
  const limited = await limit(req, "avail", 120, 60);
  if (limited) return limited;
  try {
    const q = parse(searchSchema, Object.fromEntries(new URL(req.url).searchParams));
    const r = await search(q);
    if ("error" in r) return problem(404, r.error!, "Location not found");
    return json({ ...r, generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return handleError(e);
  }
}
