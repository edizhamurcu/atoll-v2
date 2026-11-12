import { json, limit } from "@/server/http";
import { issueChallenge } from "@/server/challenge";

/** A fresh question for the contact form. */
export async function GET(req: Request) {
  const limited = await limit(req, "chal", 30, 600);
  if (limited) return limited;
  return json(issueChallenge(), { headers: { "cache-control": "no-store" } });
}
