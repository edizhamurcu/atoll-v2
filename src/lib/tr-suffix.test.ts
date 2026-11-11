import { describe, expect, it } from "vitest";
import { trAblative } from "./tr-suffix";

describe("trAblative", () => {
  it.each([
    [25, "'ten"], [30, "'dan"], [90, "'dan"], [20, "'den"], [40, "'tan"], [45, "'ten"], [50, "'den"], [60, "'tan"],
    [70, "'ten"], [80, "'den"], [100, "'den"], [120, "'den"], [130, "'dan"], [1000, "'den"], [26, "'dan"], [21, "'den"],
    ["25.00", "'ten"], ["30.00", "'dan"], ["24.50", "'den"],
  ])("%s -> %s", (n, s) => expect(trAblative(n)).toBe(s));
});
