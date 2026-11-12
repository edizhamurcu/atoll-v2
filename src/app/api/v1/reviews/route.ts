import { handleError, json, limit, parse, problem, readJson } from "@/server/http";
import { ReviewInput, submitReview } from "@/server/reviews";

/** Customer review from the signed link; stored as PENDING until approved in the admin panel. */
export async function POST(req: Request) {
  const limited = await limit(req, "review", 5, 600);
  if (limited) return limited;
  try {
    const r = await submitReview(parse(ReviewInput, await readJson(req)));
    if ("error" in r) return problem(r.error === "DONE" ? 409 : r.error === "EARLY" ? 425 : 404, r.error ?? "INVALID", "Review not accepted");
    return json({ ok: true }, 201);
  } catch (e) {
    return handleError(e);
  }
}
