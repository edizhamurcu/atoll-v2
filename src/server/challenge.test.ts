import { describe, expect, it } from "vitest";
import { issueChallenge, verifyChallenge } from "./challenge";

describe("contact form human check", () => {
  const t0 = 1_800_000_000_000;
  it("accepts the right answer after a human delay, once", async () => {
    const c = issueChallenge(t0);
    expect(c.token).not.toContain(String(c.a + c.b) + ".");
    expect(await verifyChallenge(c.token, String(c.a + c.b), t0 + 5_000)).toBe("OK");
  });
  it("rejects wrong, missing, too fast, expired and forged answers", async () => {
    const c = issueChallenge(t0);
    expect(await verifyChallenge(c.token, c.a + c.b + 1, t0 + 5_000)).toBe("WRONG");
    expect(await verifyChallenge(c.token, "", t0 + 5_000)).toBe("MISSING");
    expect(await verifyChallenge(undefined, 3, t0 + 5_000)).toBe("MISSING");
    expect(await verifyChallenge(c.token, c.a + c.b, t0 + 1_000)).toBe("TOO_FAST");
    expect(await verifyChallenge(c.token, c.a + c.b, t0 + 3 * 3_600_000)).toBe("EXPIRED");
    const forged = c.token.replace(/^\d+/, String(t0 - 60_000));
    expect(await verifyChallenge(forged, c.a + c.b, t0 + 5_000)).toBe("WRONG");
    expect(await verifyChallenge("1.2.3", 5, t0)).toBe("WRONG");
  });
});
