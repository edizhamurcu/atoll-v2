/**
 * Rental campaigns ("pay N days less"), applied by the pricing engine (pricing.ts).
 * Free days are the cheapest days of the rental. When several campaigns apply, the one that saves
 * the most wins; campaigns are never stacked with each other or with the long-rental % discount.
 */
export type Campaign = { code: string; models: readonly string[] | "all"; minDays: number; freeDays: number };

/**
 * Weekly offer (owner, 2026-11-11): one car from each class, rent 7+ days -> 1 day free.
 * (The earlier all-car weekly and BMW 520d / i30 monthly offers were cancelled the same day.)
 */
export const CAMPAIGNS: readonly Campaign[] = [
  {
    code: "week_1_day_free",
    // Economy, Mid-size, SUV, 7+ seats, Luxury: the most widely available model of each class
    models: ["nissan-note", "nissan-juke", "suzuki-vitara", "toyota-sienta-1-5", "mercedes-c200"],
    minDays: 7,
    freeDays: 1,
  },
];

export const WEEK_CAMPAIGN = CAMPAIGNS[0];

/** Every campaign that can apply to this model (the engine picks the best one for the rental length). */
export function campaignsFor(modelSlug: string): Campaign[] {
  return CAMPAIGNS.filter((c) => c.models === "all" || c.models.includes(modelSlug));
}

/** The model-specific campaign (shown as a badge on the car), if any. */
export function campaignFor(modelSlug: string): Campaign | null {
  return CAMPAIGNS.find((c) => c.models !== "all" && c.models.includes(modelSlug)) ?? null;
}
