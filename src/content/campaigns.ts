/**
 * Rental campaigns ("pay N days less"), applied by the pricing engine (pricing.ts).
 * Free days are the cheapest days of the rental. When several campaigns apply, the one that saves
 * the most wins; campaigns are never stacked with each other or with the long-rental % discount.
 */
export type Campaign = {
  code: string;
  models: readonly string[] | "all";
  minDays: number;
  freeDays: number;
  /** Last day (inclusive, Cyprus time) on which a rental may START and still get the campaign. */
  validUntil: string;
};

/** Owner decision 2026-11-16: all campaigns and special offers end at the end of March 2027; normal daily prices apply afterwards. */
export const CAMPAIGNS_END = "2027-03-31";

/**
 * Weekly offer (owner, 2026-11-11): one car from each class, rent 7+ days -> 1 day free.
 * (The earlier all-car weekly and BMW 520d / i30 monthly offers were cancelled the same day.)
 */
export const CAMPAIGNS: readonly Campaign[] = [
  {
    code: "week_1_day_free",
    // Economy, Mid-size, SUV, 7+ seats, Luxury: the most widely available model of each class;
    // Hyundai ix35 and Ford Focus added by the owner on 2026-11-16
    models: ["nissan-note", "nissan-juke", "suzuki-vitara", "toyota-sienta-1-5", "mercedes-c200", "hyundai-ix35", "ford-focus"],
    minDays: 7,
    freeDays: 1,
    validUntil: CAMPAIGNS_END,
  },
];

export const WEEK_CAMPAIGN = CAMPAIGNS[0];

/** Cyprus calendar date (YYYY-MM-DD) of an instant. */
function cyprusDate(at: Date): string {
  return at.toLocaleDateString("sv-SE", { timeZone: "Europe/Nicosia" });
}

/** True while a rental starting at `at` still gets the campaign. */
export function campaignActive(c: Campaign, at: Date = new Date()): boolean {
  return cyprusDate(at) <= c.validUntil;
}

/** Campaigns that are still running for a rental starting at `at` (default: now). */
export function activeCampaigns(at: Date = new Date()): Campaign[] {
  return CAMPAIGNS.filter((c) => campaignActive(c, at));
}

/** Every campaign that can apply to this model for a rental starting at `at` (the engine picks the best one for the rental length). */
export function campaignsFor(modelSlug: string, at: Date = new Date()): Campaign[] {
  return activeCampaigns(at).filter((c) => c.models === "all" || c.models.includes(modelSlug));
}

/** The model-specific campaign (shown as a badge on the car), if any is still running at `at`. */
export function campaignFor(modelSlug: string, at: Date = new Date()): Campaign | null {
  return activeCampaigns(at).find((c) => c.models !== "all" && c.models.includes(modelSlug)) ?? null;
}
