import { describe, expect, it } from "vitest";
import { seo, seoAlternates, seoDescription, seoTitle } from "./seo";

describe("seo helpers", () => {
  it("drops the brand suffix only for long titles", () => {
    expect(seoTitle("Car prices")).toBe("Car prices");
    expect(seoTitle("Autofahren in Nordzypern: 12 Dinge, die Sie wissen sollten")).toEqual({ absolute: "Autofahren in Nordzypern: 12 Dinge, die Sie wissen sollten" });
  });
  it("cuts descriptions at a word boundary", () => {
    const d = seoDescription("word ".repeat(60))!;
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith("…")).toBe(true);
    expect(seoDescription("short")).toBe("short");
  });
  it("always gives x-default and an og:image", () => {
    expect(seoAlternates("de", "/cars")).toEqual({ canonical: "/de/cars", languages: { en: "/en/cars", tr: "/tr/cars", de: "/de/cars", ru: "/ru/cars", "x-default": "/en/cars" } });
    const m = seo({ title: "About us", description: "x", openGraph: { title: "About us", url: "/en/about-us" } }, "en");
    expect(m.openGraph?.images).toEqual([expect.objectContaining({ url: "/brand/og.png" })]);
    expect(m.twitter).toMatchObject({ card: "summary_large_image", images: ["/brand/og.png"] });
  });
});
