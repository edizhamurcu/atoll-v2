/**
 * Rental campaigns ("pay N days less"), applied by the pricing engine (pricing.ts).
 * Free days are the cheapest days of the rental. When several campaigns apply, the one that saves
 * the most wins; campaigns are never stacked with each other or with the long-rental % discount.
 */
export type Campaign = { code: string; models: readonly string[] | "all"; minDays: number; freeDays: number };

/** No campaigns are running. Owner, 2026-11-11: the weekly (7 days -> 1 free) and monthly
 * (BMW 520d / Hyundai i30, 30 days -> 3 free) offers were cancelled; prices are the normal daily rates.
 * The engine still supports campaigns: add an entry here to start one again. */
export const CAMPAIGNS: readonly Campaign[] = [];

/** Every campaign that can apply to this model (the engine picks the best one for the rental length). */
export function campaignsFor(modelSlug: string): Campaign[] {
  return CAMPAIGNS.filter((c) => c.models === "all" || c.models.includes(modelSlug));
}

/** The model-specific campaign (shown as a badge on the car), if any. */
export function campaignFor(modelSlug: string): Campaign | null {
  return CAMPAIGNS.find((c) => c.models !== "all" && c.models.includes(modelSlug)) ?? null;
}
