import Decimal from "decimal.js";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { addDays } from "date-fns";

/** Pure pricing engine. No DB/IO — everything it needs is passed in. */

export type Money = string; // fixed 2dp string, e.g. "130.00"

export interface RentalRules {
  timezone: string; // business TZ, e.g. "Asia/Famagusta"
  graceMinutes: number; // late return tolerance before an extra day is charged
  minDays: number;
  maxDays: number;
  bufferMinutes: number; // turnaround between rentals
  deposit: { type: "fixed" | "percent" | "firstDay"; value: number; min?: number };
}

export interface SeasonRateInput {
  startDate: string; // YYYY-MM-DD inclusive (business TZ)
  endDate: string;
  dailyRate: Decimal.Value;
}

export interface ExtraInput {
  id: string;
  code: string;
  pricing: "PER_DAY" | "PER_RENTAL";
  price: Decimal.Value;
  maxQty: number;
}

export interface QuoteInput {
  pickupAt: Date;
  returnAt: Date;
  baseDailyRate: Decimal.Value;
  seasonRates: SeasonRateInput[];
  discounts: { minDays: number; percent: Decimal.Value }[];
  extras: { extra: ExtraInput; quantity: number }[];
  pickupFee: Decimal.Value;
  returnFee: Decimal.Value;
  deliveryTiers?: { minDays: number; fee: Decimal.Value }[] | null;
  /** "Pay N days less" campaign for this model (src/content/campaigns.ts). */
  campaign?: { code: string; minDays: number; freeDays: number } | null;
  rules: RentalRules;
}

export interface QuoteLine {
  kind: "rental" | "discount" | "extra" | "fee";
  code: string;
  label: string;
  quantity: number;
  unit: Money;
  total: Money;
}

export interface Quote {
  days: number;
  dailyBreakdown: { date: string; rate: Money }[];
  rentalTotal: Money;
  discountPercent: Money;
  discountTotal: Money;
  /** Days given free by a campaign (0 when the long-rental % discount or nothing applied). */
  campaignFreeDays: number;
  campaignCode: string | null;
  extrasTotal: Money;
  feesTotal: Money;
  grandTotal: Money;
  depositAmount: Money;
  payOnPickup: Money;
  averageDaily: Money;
  lines: QuoteLine[];
}

export class PricingError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const m = (v: Decimal.Value) => new Decimal(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
const fmt = (v: Decimal.Value): Money => m(v).toFixed(2);

/** Billable days: every started 24h block after the grace period counts. */
export function billableDays(pickupAt: Date, returnAt: Date, graceMinutes: number): number {
  const ms = returnAt.getTime() - pickupAt.getTime();
  if (!(ms > 0)) throw new PricingError("INVALID_RANGE", "Return must be after pickup");
  const dayMs = 24 * 60 * 60 * 1000;
  const fullDays = Math.floor(ms / dayMs);
  const remainder = ms - fullDays * dayMs;
  const days = fullDays + (remainder > graceMinutes * 60 * 1000 ? 1 : 0);
  return Math.max(days, 1);
}

/** Calendar date (business TZ) of each billable day, starting at the pickup date. */
export function rentalDates(pickupAt: Date, days: number, timezone: string): string[] {
  const startLocal = formatInTimeZone(pickupAt, timezone, "yyyy-MM-dd");
  const anchor = fromZonedTime(`${startLocal}T12:00:00`, timezone); // noon avoids DST edges
  return Array.from({ length: days }, (_, i) => formatInTimeZone(addDays(anchor, i), timezone, "yyyy-MM-dd"));
}

/** Season rate for a calendar day. Seasons are passed oldest-first; on overlap the most recently
 * defined one wins (same rule as the WordPress Motors theme: ORDER BY id DESC LIMIT 1). */
export function rateForDate(date: string, base: Decimal.Value, seasons: SeasonRateInput[]): Decimal {
  const hits = seasons.filter((s) => s.startDate <= date && date <= s.endDate);
  const hit = hits[hits.length - 1];
  return m(hit ? hit.dailyRate : base);
}

function pickTier<T extends { minDays: number }>(tiers: T[], days: number): T | undefined {
  return [...tiers].filter((t) => t.minDays <= days).sort((a, b) => b.minDays - a.minDays)[0];
}

export function computeQuote(input: QuoteInput): Quote {
  const { rules } = input;
  const days = billableDays(input.pickupAt, input.returnAt, rules.graceMinutes);
  if (days < rules.minDays) throw new PricingError("MIN_DAYS", `Minimum rental is ${rules.minDays} day(s)`);
  if (days > rules.maxDays) throw new PricingError("MAX_DAYS", `Maximum rental is ${rules.maxDays} days`);

  const dates = rentalDates(input.pickupAt, days, rules.timezone);
  const daily = dates.map((date) => ({ date, rate: rateForDate(date, input.baseDailyRate, input.seasonRates) }));
  const rentalTotal = daily.reduce((s, d) => s.plus(d.rate), new Decimal(0));

  const tier = pickTier(input.discounts, days);
  const tierPercent = tier ? new Decimal(tier.percent) : new Decimal(0);
  const tierTotal = m(rentalTotal.mul(tierPercent).div(100));

  // Campaign: the cheapest `freeDays` days of the rental are free. Not stacked with the % discount; the larger saving wins.
  const camp = input.campaign && days >= input.campaign.minDays && input.campaign.freeDays > 0 ? input.campaign : null;
  const campTotal = camp
    ? m(daily.map((d) => d.rate).sort((a, b) => a.comparedTo(b)).slice(0, Math.min(camp.freeDays, days)).reduce((s, r) => s.plus(r), new Decimal(0)))
    : new Decimal(0);
  const useCampaign = camp !== null && campTotal.gt(tierTotal);
  const discountTotal = useCampaign ? campTotal : tierTotal;
  const discountPercent = useCampaign ? new Decimal(0) : tierPercent;

  const lines: QuoteLine[] = [
    { kind: "rental", code: "rental", label: "Car rental", quantity: days, unit: fmt(rentalTotal.div(days)), total: fmt(rentalTotal) },
  ];
  if (useCampaign) {
    lines.push({ kind: "discount", code: `campaign_${camp!.code}`, label: `Campaign: ${camp!.freeDays} days free`, quantity: camp!.freeDays, unit: fmt(campTotal.div(camp!.freeDays).neg()), total: fmt(campTotal.neg()) });
  } else if (discountTotal.gt(0)) {
    lines.push({ kind: "discount", code: `discount_${tier!.minDays}d`, label: `${discountPercent.toString()}% long-rental discount`, quantity: 1, unit: fmt(discountTotal.neg()), total: fmt(discountTotal.neg()) });
  }

  let extrasTotal = new Decimal(0);
  for (const { extra, quantity } of input.extras) {
    if (!Number.isInteger(quantity) || quantity < 1) throw new PricingError("BAD_EXTRA_QTY", `Invalid quantity for ${extra.code}`);
    if (quantity > extra.maxQty) throw new PricingError("BAD_EXTRA_QTY", `Max ${extra.maxQty} for ${extra.code}`);
    const unit = m(extra.price);
    const total = extra.pricing === "PER_DAY" ? unit.mul(days).mul(quantity) : unit.mul(quantity);
    extrasTotal = extrasTotal.plus(total);
    lines.push({ kind: "extra", code: extra.code, label: extra.code, quantity, unit: fmt(unit), total: fmt(total) });
  }

  let feesTotal = new Decimal(0);
  const addFee = (code: string, label: string, v: Decimal.Value) => {
    const d = m(v);
    if (d.gt(0)) {
      feesTotal = feesTotal.plus(d);
      lines.push({ kind: "fee", code, label, quantity: 1, unit: fmt(d), total: fmt(d) });
    }
  };
  addFee("pickup_fee", "Pick-up location fee", input.pickupFee);
  addFee("return_fee", "Return location fee", input.returnFee);
  if (input.deliveryTiers?.length) {
    const t = pickTier(input.deliveryTiers, days);
    if (!t) throw new PricingError("NO_DELIVERY_TIER", "Delivery not available for this duration");
    addFee("delivery", "Delivery & collection", t.fee);
  }

  const grandTotal = m(rentalTotal.minus(discountTotal).plus(extrasTotal).plus(feesTotal));

  let deposit: Decimal;
  switch (rules.deposit.type) {
    case "fixed":
      deposit = m(rules.deposit.value);
      break;
    case "percent":
      deposit = m(grandTotal.mul(rules.deposit.value).div(100));
      break;
    case "firstDay":
      deposit = m(daily[0].rate);
      break;
  }
  if (rules.deposit.min !== undefined) deposit = Decimal.max(deposit, m(rules.deposit.min));
  deposit = Decimal.min(deposit, grandTotal);

  return {
    days,
    dailyBreakdown: daily.map((d) => ({ date: d.date, rate: fmt(d.rate) })),
    rentalTotal: fmt(rentalTotal),
    discountPercent: discountPercent.toFixed(2),
    discountTotal: fmt(discountTotal),
    campaignFreeDays: useCampaign ? camp!.freeDays : 0,
    campaignCode: useCampaign ? camp!.code : null,
    extrasTotal: fmt(extrasTotal),
    feesTotal: fmt(feesTotal),
    grandTotal: fmt(grandTotal),
    depositAmount: fmt(deposit),
    payOnPickup: fmt(grandTotal.minus(deposit)),
    averageDaily: fmt(rentalTotal.minus(discountTotal).div(days)),
    lines,
  };
}
