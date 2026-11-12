import { describe, expect, it } from "vitest";
import { parseReviewToken, reviewToken, ReviewInput, submitReview } from "./reviews";

describe("review links", () => {
  it("round-trips a signed booking ref and rejects tampering", () => {
    const tok = reviewToken("ATL-ABC123");
    expect(parseReviewToken(tok)).toBe("ATL-ABC123");
    expect(parseReviewToken(tok.replace("ATL-ABC123", "ATL-ABC124"))).toBeNull();
    expect(parseReviewToken(`${tok.slice(0, -1)}${tok.endsWith("A") ? "B" : "A"}`)).toBeNull();
    expect(parseReviewToken("ATL-ABC123")).toBeNull();
  });
  it("validates input: rating 1-5, 20+ chars, no links, honeypot empty", () => {
    const ok = { token: "x", rating: 5, text: "Great car and a very easy hand-over.", name: "Sarah K.", locale: "en" as const };
    expect(ReviewInput.safeParse(ok).success).toBe(true);
    expect(ReviewInput.safeParse({ ...ok, rating: 6 }).success).toBe(false);
    expect(ReviewInput.safeParse({ ...ok, text: "short" }).success).toBe(false);
    expect(ReviewInput.safeParse({ ...ok, text: "Visit https://spam.example for cheap stuff" }).success).toBe(false);
    expect(ReviewInput.safeParse({ ...ok, name: "www.spam.com" }).success).toBe(false);
    expect(ReviewInput.safeParse({ ...ok, website: "bot" }).success).toBe(false);
  });
  it("refuses a submission with an unsigned link", async () => {
    expect(await submitReview({ token: "ATL-NOPE.aaaaaaaaaaaaaaaaaaaaaa", rating: 5, text: "x".repeat(25), name: "Bot", locale: "en" })).toEqual({ error: "INVALID" });
  });
});
