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

import { normalizeAgreement } from "./page-merge";
import dePages from "./page-i18n/de";
describe("agreement headings", () => {
  it("turns bold/underlined/caps titles into h2 and keeps body text", () => {
    for (const [pages, l] of [[trPages, "tr"], [dePages, "de"]] as const) {
      const out = normalizeAgreement(pages["rental-agreement"].html, l);
      expect(out).not.toMatch(/<u>|<hr|<p><strong>\d+\./);
      expect(out).not.toMatch(/<ol>\s*<li>[^<.]{3,30}<\/li>\s*<\/ol>/);
      expect((out.match(/<h2>/g) ?? []).length).toBeGreaterThanOrEqual(9);
      expect(out).toContain("<h2>1. ");
    }
    const tr = normalizeAgreement(trPages["rental-agreement"].html, "tr");
    expect(tr).toContain("<h2>Çarpışma hasarı muafiyeti (C.D.W.)</h2>");
    expect(tr).toContain("<h2>7. Uyuşmazlık</h2>");
    expect(tr).toContain("<h2>Şartlar ve Koşullar</h2>");
  });
});
