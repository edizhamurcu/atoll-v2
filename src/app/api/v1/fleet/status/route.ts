import { json, handleError, limit, requireApiKey } from "@/server/http";
import { fleetStatusNow } from "@/server/availability";

/** Partner/ops API: live state of every vehicle. Requires API key with scope fleet:read. */
export async function GET(req: Request) {
  const limited = await limit(req, "fleet", 60, 60);
  if (limited) return limited;
  const auth = await requireApiKey(req, "fleet:read");
  if (auth.error) return auth.error;
  try {
    return json({ data: await fleetStatusNow(), generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return handleError(e);
  }
}
