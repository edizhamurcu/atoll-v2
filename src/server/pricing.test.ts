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

describe("campaign: rent 30 days, pay 27 (2026-11-10)", () => {
  const camp = { code: "month_3_days_free", minDays: 30, freeDays: 3 };
  const days = (n: number) => ({ returnAt: new Date(at("2027-06-01T10:00:00+03:00").getTime() + n * 86_400_000) });

  it("30 days at £30 -> pays 27 days (£810)", () => {
    const q = computeQuote(base({ ...days(30), campaigns: [camp] }));
    expect(q.days).toBe(30);
    expect(q.rentalTotal).toBe("900.00");
    expect(q.discountTotal).toBe("90.00");
    expect(q.grandTotal).toBe("810.00");
    expect(q.campaignFreeDays).toBe(3);
    expect(q.lines.find((l) => l.kind === "discount")?.code).toBe("campaign_month_3_days_free");
  });
  it("BMW 520d: 30 days at £90 -> £2430", () => {
    expect(computeQuote(base({ ...days(30), baseDailyRate: "90", campaigns: [camp] })).grandTotal).toBe("2430.00");
  });
  it("29 days: no campaign", () => {
    const q = computeQuote(base({ ...days(29), campaigns: [camp] }));
    expect(q.discountTotal).toBe("0.00");
    expect(q.campaignFreeDays).toBe(0);
  });
  it("longer than a month: still 3 free days", () => {
    expect(computeQuote(base({ ...days(45), campaigns: [camp] })).discountTotal).toBe("90.00");
  });
  it("free days are the cheapest days when seasons differ", () => {
    const q = computeQuote(base({ ...days(30), campaigns: [camp], seasonRates: [{ startDate: "2027-06-01", endDate: "2027-06-27", dailyRate: "50" }] }));
    // 27 days at 50 + 3 days at the base 30; the three £30 days are free
    expect(q.rentalTotal).toBe("1440.00");
    expect(q.discountTotal).toBe("90.00");
  });
  it("not stacked with the long-rental discount: the larger saving wins", () => {
    const small = computeQuote(base({ ...days(30), campaigns: [camp], discounts: [{ minDays: 30, percent: 5 }] }));
    expect(small.discountTotal).toBe("90.00"); // 3 days (£90) > 5% (£45)
    expect(small.discountPercent).toBe("0.00");
    const big = computeQuote(base({ ...days(30), campaigns: [camp], discounts: [{ minDays: 30, percent: 15 }] }));
    expect(big.discountTotal).toBe("135.00"); // 15% (£135) > 3 days
    expect(big.campaignFreeDays).toBe(0);
  });
  it("cars without a campaign are unchanged", () => {
    expect(computeQuote(base(days(30))).grandTotal).toBe("900.00");
  });
});

describe("weekly campaign: rent 7 days, pay 6 (2026-11-10)", () => {
  const week = { code: "week_1_day_free", minDays: 7, freeDays: 1 };
  const month = { code: "month_3_days_free", minDays: 30, freeDays: 3 };
  const days = (n: number) => ({ returnAt: new Date(at("2027-06-01T10:00:00+03:00").getTime() + n * 86_400_000) });

  it("7 days at £30 -> £180 (one day free)", () => {
    const q = computeQuote(base({ ...days(7), campaigns: [week] }));
    expect(q.grandTotal).toBe("180.00");
    expect(q.campaignCode).toBe("week_1_day_free");
    expect(q.campaignFreeDays).toBe(1);
  });
  it("6 days: no campaign", () => expect(computeQuote(base({ ...days(6), campaigns: [week] })).discountTotal).toBe("0.00"));
  it("cars with both campaigns: 30 days uses the month campaign (3 days), 10 days the weekly one", () => {
    expect(computeQuote(base({ ...days(30), campaigns: [month, week] })).campaignCode).toBe("month_3_days_free");
    expect(computeQuote(base({ ...days(30), campaigns: [week, month] })).discountTotal).toBe("90.00");
    expect(computeQuote(base({ ...days(10), campaigns: [month, week] })).campaignCode).toBe("week_1_day_free");
  });
});
