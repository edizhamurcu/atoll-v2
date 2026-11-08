import { describe, expect, it } from "vitest";
import { billableDays, computeQuote, rentalDates, PricingError, type QuoteInput, type RentalRules } from "./pricing";

const rules: RentalRules = {
  timezone: "Asia/Famagusta",
  graceMinutes: 59,
  minDays: 1,
  maxDays: 60,
  bufferMinutes: 120,
  deposit: { type: "firstDay", value: 0, min: 30 },
};
const at = (s: string) => new Date(s);
const base = (over: Partial<QuoteInput> = {}): QuoteInput => ({
  pickupAt: at("2027-06-01T10:00:00+03:00"),
  returnAt: at("2027-06-08T10:00:00+03:00"),
  baseDailyRate: "30",
  seasonRates: [],
  discounts: [],
  extras: [],
  pickupFee: 0,
  returnFee: 0,
  rules,
  ...over,
});

describe("billableDays", () => {
  it("counts exact 24h blocks", () => expect(billableDays(at("2027-01-01T10:00Z"), at("2027-01-08T10:00Z"), 59)).toBe(7));
  it("tolerates grace period", () => expect(billableDays(at("2027-01-01T10:00Z"), at("2027-01-08T10:59Z"), 59)).toBe(7));
  it("charges a day after grace", () => expect(billableDays(at("2027-01-01T10:00Z"), at("2027-01-08T11:00Z"), 59)).toBe(8));
  it("minimum one day for short rentals", () => expect(billableDays(at("2027-01-01T10:00Z"), at("2027-01-01T12:00Z"), 59)).toBe(1));
  it("rejects reversed range", () => expect(() => billableDays(at("2027-01-02T10:00Z"), at("2027-01-01T10:00Z"), 59)).toThrow(PricingError));
  it("rejects zero length", () => expect(() => billableDays(at("2027-01-01T10:00Z"), at("2027-01-01T10:00Z"), 59)).toThrow(PricingError));
});

describe("rentalDates", () => {
  it("uses business timezone date (late-night UTC pickup)", () => {
    // 22:30 UTC on 31 May = 01:30 on 1 June in Cyprus (summer, UTC+3)
    expect(rentalDates(at("2027-05-31T22:30:00Z"), 2, "Asia/Famagusta")).toEqual(["2027-06-01", "2027-06-02"]);
  });
  it("crosses DST change without skipping days", () => {
    const d = rentalDates(at("2027-03-27T10:00:00Z"), 3, "Asia/Famagusta");
    expect(d).toEqual(["2027-03-27", "2027-03-28", "2027-03-29"]);
  });
});

describe("computeQuote", () => {
  it("base price x days, deposit = first day", () => {
    const q = computeQuote(base());
    expect(q.days).toBe(7);
    expect(q.grandTotal).toBe("210.00");
    expect(q.depositAmount).toBe("30.00");
    expect(q.payOnPickup).toBe("180.00");
  });

  it("most recently defined season wins on overlap (WP parity)", () => {
    const q = computeQuote(base({ returnAt: at("2027-06-02T10:00:00+03:00"), seasonRates: [{ startDate: "2027-05-01", endDate: "2027-06-30", dailyRate: "40" }, { startDate: "2027-06-01", endDate: "2027-06-01", dailyRate: "25" }] }));
    expect(q.rentalTotal).toBe("25.00");
    const q2 = computeQuote(base({ returnAt: at("2027-06-02T10:00:00+03:00"), seasonRates: [{ startDate: "2027-06-01", endDate: "2027-06-01", dailyRate: "25" }, { startDate: "2027-05-01", endDate: "2027-06-30", dailyRate: "40" }] }));
    expect(q2.rentalTotal).toBe("40.00");
  });

  it("applies season rate only to days inside the season", () => {
    const q = computeQuote(base({ seasonRates: [{ startDate: "2027-06-05", endDate: "2027-09-30", dailyRate: "45" }] }));
    // 1,2,3,4 Jun @30 + 5,6,7 Jun @45
    expect(q.rentalTotal).toBe("255.00");
  });

  it("picks highest applicable long-rental discount", () => {
    const q = computeQuote(base({ discounts: [{ minDays: 3, percent: "5" }, { minDays: 7, percent: "10" }, { minDays: 14, percent: "15" }] }));
    expect(q.discountPercent).toBe("10.00");
    expect(q.discountTotal).toBe("21.00");
    expect(q.grandTotal).toBe("189.00");
  });

  it("prices per-day and per-rental extras", () => {
    const q = computeQuote(
      base({
        extras: [
          { extra: { id: "1", code: "baby_seat", pricing: "PER_DAY", price: "3", maxQty: 2 }, quantity: 2 },
          { extra: { id: "2", code: "south_cyprus", pricing: "PER_RENTAL", price: "50", maxQty: 1 }, quantity: 1 },
        ],
      }),
    );
    expect(q.extrasTotal).toBe("92.00"); // 3*7*2 + 50
    expect(q.grandTotal).toBe("302.00");
  });

  it("rejects extra quantity above max", () => {
    expect(() =>
      computeQuote(base({ extras: [{ extra: { id: "1", code: "x", pricing: "PER_RENTAL", price: "1", maxQty: 1 }, quantity: 2 }] })),
    ).toThrow(/Max 1/);
  });

  it("adds location fees and delivery tier by duration", () => {
    const q = computeQuote(
      base({ pickupFee: "90", deliveryTiers: [{ minDays: 1, fee: "60" }, { minDays: 4, fee: "55" }, { minDays: 6, fee: "50" }] }),
    );
    expect(q.feesTotal).toBe("140.00");
    expect(q.grandTotal).toBe("350.00");
  });

  it("deposit never exceeds total, min applies", () => {
    const q = computeQuote(
      base({ returnAt: at("2027-06-02T10:00:00+03:00"), baseDailyRate: "20", rules: { ...rules, deposit: { type: "fixed", value: 50 } } }),
    );
    expect(q.grandTotal).toBe("20.00");
    expect(q.depositAmount).toBe("20.00");
  });

  it("decimal-safe rounding (no float drift)", () => {
    const q = computeQuote(
      base({ extras: [{ extra: { id: "b", code: "booster", pricing: "PER_DAY", price: "2.5", maxQty: 3 }, quantity: 3 }], returnAt: at("2027-06-04T10:00:00+03:00") }),
    );
    expect(q.extrasTotal).toBe("22.50");
    expect(q.grandTotal).toBe("112.50");
  });

  it("enforces min days rule", () => {
    expect(() => computeQuote(base({ rules: { ...rules, minDays: 3 }, returnAt: at("2027-06-02T10:00:00+03:00") }))).toThrow(/Minimum/);
  });
});
