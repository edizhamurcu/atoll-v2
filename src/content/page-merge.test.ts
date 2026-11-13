import { describe, expect, it } from "vitest";
import { dropAgreementTeaser, rewriteMergedLinks } from "./page-merge";
import trPages from "./page-i18n/tr";

describe("rental agreement merged into rental terms", () => {
  it("rewrites links to the merged page", () => {
    expect(rewriteMergedLinks('<a href="/de/rental-agreement">x</a> <a href="/de/fuel-options">y</a>')).toBe('<a href="/de/rental-terms#agreement">x</a> <a href="/de/fuel-options">y</a>');
  });
  it("drops only the closing 'see the agreement' section of rental terms", () => {
    const html = trPages["rental-terms"].html;
    const out = dropAgreementTeaser(html);
    expect(out).not.toContain("rental-agreement");
    expect(out).toContain("Kiralamanın Uzatılması");
    expect(html.length - out.length).toBeLessThan(200);
  });
});
