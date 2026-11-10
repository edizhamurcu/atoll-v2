/**
 * Rental campaigns (owner, 2026-11-10): rent one of these cars for a full month (30+ days)
 * and pay 3 days less. The free days are the cheapest days of the rental, so a mixed-season
 * rental never gives away a peak day. Not combined with the long-rental % discount: the
 * customer gets whichever saves more (pricing.ts).
 */
export type Campaign = { code: string; models: readonly string[]; minDays: number; freeDays: number };

export const CAMPAIGNS: readonly Campaign[] = [
  { code: "month_3_days_free", models: ["bmw-520d", "hyundai-i30"], minDays: 30, freeDays: 3 },
];

export function campaignFor(modelSlug: string): Campaign | null {
  return CAMPAIGNS.find((c) => c.models.includes(modelSlug)) ?? null;
}
