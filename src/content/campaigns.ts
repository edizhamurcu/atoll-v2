/**
 * Rental campaigns ("pay N days less"), applied by the pricing engine (pricing.ts):
 * - month_3_days_free (owner, 2026-11-10): BMW 520d and Hyundai i30, 30+ days -> 3 days free.
 * - week_1_day_free (owner, 2026-11-10): every car, 7+ days -> 1 day free.
 * Free days are the cheapest days of the rental. When several campaigns apply, the one that saves
 * the most wins; campaigns are never stacked with each other or with the long-rental % discount.
 */
export type Campaign = { code: string; models: readonly string[] | "all"; minDays: number; freeDays: number };

export const CAMPAIGNS: readonly Campaign[] = [
  { code: "month_3_days_free", models: ["bmw-520d", "hyundai-i30"], minDays: 30, freeDays: 3 },
  { code: "week_1_day_free", models: "all", minDays: 7, freeDays: 1 },
];

export const WEEK_CAMPAIGN = CAMPAIGNS.find((c) => c.code === "week_1_day_free")!;
export const MONTH_CAMPAIGN = CAMPAIGNS.find((c) => c.code === "month_3_days_free")!;

/** Every campaign that can apply to this model (the engine picks the best one for the rental length). */
export function campaignsFor(modelSlug: string): Campaign[] {
  return CAMPAIGNS.filter((c) => c.models === "all" || c.models.includes(modelSlug));
}

/** The model-specific campaign (shown as a badge on the car), if any. */
export function campaignFor(modelSlug: string): Campaign | null {
  return CAMPAIGNS.find((c) => c.models !== "all" && c.models.includes(modelSlug)) ?? null;
}
