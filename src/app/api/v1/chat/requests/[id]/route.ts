import { z } from "zod";
import { handleError, json, limit, parse, problem, readJson } from "@/server/http";
import { confirmRequest, dismissRequest } from "@/server/chat/store";

const Body = z.object({ sessionId: z.string().regex(/^[a-f0-9]{32}$/), action: z.enum(["confirm", "dismiss"]) });

/** The visitor's own click on Confirm / Dismiss under a draft. This endpoint, not the model, submits requests. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const limited = await limit(req, "chat-req", 10, 600);
  if (limited) return limited;
  try {
    const { id } = await ctx.params;
    if (!/^[a-z0-9]{20,40}$/.test(id)) return problem(404, "NOT_FOUND", "Request not found");
    const b = parse(Body, await readJson(req, 2048));
    if (b.action === "dismiss") return (await dismissRequest(id, b.sessionId)) ? json({ status: "CANCELLED" }) : problem(404, "NOT_FOUND", "Request not found");
    const r = await confirmRequest(id, b.sessionId);
    if (r === "NOT_FOUND") return problem(404, "NOT_FOUND", "Request not found");
    if (r === "CANCELLED") return problem(409, "CANCELLED", "This request was dismissed");
    return json({ status: "SUBMITTED" });
  } catch (e) {
    return handleError(e);
  }
}
