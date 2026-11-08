import { describe, expect, it } from "vitest";
import { faqFromHtml, plainText } from "./pages";
import { cleanHtml } from "../../scripts/import-pages";

describe("migrated content", () => {
  it("rewrites legacy links and image paths, strips empty paragraphs and nbsp", () => {
    const h = cleanHtml('<p><h2>T</h2></p><p>&nbsp;</p><p>See <a href="/driving-in-south-cyprus/">terms</a>, <a href="/about-us-2/">about</a> and <a href="/explore-vehicles/">cars</a>. <img src="/media/2019/10/x.jpg" alt=""></p>');
    expect(h).toContain("<h2>T</h2>");
    expect(h).not.toContain("<p><h2>");
    expect(h).toContain('href="/en/driving-in-south-cyprus"');
    expect(h).toContain('href="/en/about-us"');
    expect(h).toContain('href="/en/cars"');
    expect(h).toContain('src="/media/pages/2019/10/x.jpg"');
    expect(h).not.toMatch(/<p>\s*<\/p>| /);
  });

  it("builds FAQ only from question headings", () => {
    const faq = faqFromHtml("<h2>Damage Excess</h2><p>Fixed at 500 Euros</p><h2>How do I make payments?</h2><p>You can pay by <strong>cash</strong>.</p>");
    expect(faq).toEqual([{ q: "How do I make payments?", a: "You can pay by cash ." }]);
  });

  it("plainText truncates on a word boundary", () => {
    expect(plainText("<p>one two three four</p>", 12)).toBe("one two…");
  });
});
