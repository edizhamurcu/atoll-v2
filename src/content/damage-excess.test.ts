import { describe, expect, it } from "vitest";
import { DAMAGE_EXCESS, excessLabel, excessListHtml, excessSummary, withExcessList, EXCESS_MARKER } from "./damage-excess";
import { localizedRentalInfo } from "./rental-info";
import { pageTranslation } from "./page-i18n";

describe("damage excess by class (owner decision 2026-11-09)", () => {
  it("has the agreed amounts", () => {
    expect(DAMAGE_EXCESS.ECONOMY.amount).toBe(500);
    expect(DAMAGE_EXCESS.MIDDLE.amount).toBe(450);
    expect(DAMAGE_EXCESS.SUV.amount).toBe(1200);
    expect(DAMAGE_EXCESS.PEOPLE_CARRIER.amount).toBe(1200);
    expect(DAMAGE_EXCESS.LUXURY).toEqual({ amount: 2500, from: true });
  });
  it("formats per locale, luxury as a minimum", () => {
    expect(excessLabel("ECONOMY", "en")).toBe("£500");
    expect(excessLabel("SUV", "en")).toBe("£1,200");
    expect(excessLabel("LUXURY", "en")).toBe("from £2,500");
    expect(excessLabel("LUXURY", "tr")).toMatch(/2\.500.*'den başlayan$/);
    expect(excessLabel("LUXURY", "de")).toMatch(/^ab 2\.500/);
    expect(excessLabel("LUXURY", "ru")).toMatch(/^от /);
  });
  it("summary and list mention every row", () => {
    expect(excessSummary("en")).toBe("Economy £500, Mid-size £450, SUV and 7+ seaters £1,200, Luxury from £2,500");
    expect(excessListHtml("tr")).toContain("Orta sınıf");
    expect(withExcessList(`<p>x</p>${EXCESS_MARKER}`, "en")).not.toContain(EXCESS_MARKER);
  });
  it("translated rental terms carry the marker, not a fixed amount", () => {
    for (const l of ["tr", "de", "ru"]) {
      const html = pageTranslation("rental-terms", l)!.html;
      expect(html).toContain(EXCESS_MARKER);
      expect(html).not.toMatch(/£450/);
    }
  });
  it("car rental info shows the car's class excess instead of the stored WP amount", () => {
    const en = '<h3>Damage Excess: £450.00</h3><p>... the most you pay is the damage excess (£450.00) ... Collision Damage Waiver ...</p><p>delivered with £20.00 worth of fuel</p><p>unlimited free kilometres</p>';
    const outEn = localizedRentalInfo(en, "en", excessLabel("SUV", "en"));
    expect(outEn.html).toContain("£1,200");
    expect(outEn.html).not.toContain("£450.00");
    const outTr = localizedRentalInfo(en, "tr", excessLabel("ECONOMY", "tr"));
    expect(outTr.lang).toBe("tr");
    expect(outTr.html).toContain(excessLabel("ECONOMY", "tr"));
  });
});
