/**
 * Damage excess (CDW) by vehicle class — owner decision 2026-11-09, economy/mid-size corrected 2026-11-12
 * (economy £450, mid-size £500). Single source for the home page,
 * rental terms, every car page and llms.txt. `from` = the amount is a minimum ("from £2,500").
 */
export type VehicleClassKey = "ECONOMY" | "MIDDLE" | "LUXURY" | "SUV" | "PEOPLE_CARRIER" | "SPORT" | "PREMIUM";

export const DAMAGE_EXCESS: Record<VehicleClassKey, { amount: number; from?: boolean }> = {
  ECONOMY: { amount: 450 },
  MIDDLE: { amount: 500 },
  SUV: { amount: 1200 },
  PEOPLE_CARRIER: { amount: 1200 }, // 7+ seaters, same as SUV (owner decision)
  LUXURY: { amount: 2500, from: true },
  PREMIUM: { amount: 2500, from: true }, // no models today; treated like luxury
  SPORT: { amount: 2500, from: true }, // no models today; treated like luxury
};

/** Order and grouping used when the excess is listed (classes with no models are folded into luxury). */
export const EXCESS_ROWS: { classes: VehicleClassKey[]; key: VehicleClassKey }[] = [
  { classes: ["ECONOMY"], key: "ECONOMY" },
  { classes: ["MIDDLE"], key: "MIDDLE" },
  { classes: ["SUV", "PEOPLE_CARRIER"], key: "SUV" },
  { classes: ["LUXURY", "PREMIUM", "SPORT"], key: "LUXURY" },
];

const FROM: Record<string, (s: string) => string> = {
  en: (s) => `from ${s}`,
  tr: (s) => `${s}'den başlayan`,
  de: (s) => `ab ${s}`,
  ru: (s) => `от ${s}`,
};

export function gbp(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(amount);
}

export function excessLabel(cls: string, locale: string): string {
  const e = DAMAGE_EXCESS[cls as VehicleClassKey] ?? DAMAGE_EXCESS.MIDDLE;
  const s = gbp(e.amount, locale);
  return e.from ? (FROM[locale] ?? FROM.en)(s) : s;
}

const LIST_LABELS: Record<string, Record<VehicleClassKey, string>> = {
  en: { ECONOMY: "Economy", MIDDLE: "Mid-size", SUV: "SUV and 7+ seaters", LUXURY: "Luxury", PEOPLE_CARRIER: "7+ seaters", PREMIUM: "Premium", SPORT: "Sport" },
  tr: { ECONOMY: "Ekonomik", MIDDLE: "Orta sınıf", SUV: "SUV ve 7+ koltuklu", LUXURY: "Lüks", PEOPLE_CARRIER: "7+ koltuklu", PREMIUM: "Premium", SPORT: "Spor" },
  de: { ECONOMY: "Kleinwagen", MIDDLE: "Mittelklasse", SUV: "SUV und 7+ Sitzer", LUXURY: "Luxusklasse", PEOPLE_CARRIER: "7+ Sitzer", PREMIUM: "Premium", SPORT: "Sport" },
  ru: { ECONOMY: "Эконом", MIDDLE: "Средний класс", SUV: "Внедорожники и 7+ мест", LUXURY: "Люкс", PEOPLE_CARRIER: "7+ мест", PREMIUM: "Премиум", SPORT: "Спорт" },
};

/** "Economy £500, Mid-size £450, …" for running text. */
export function excessSummary(locale: string): string {
  const l = LIST_LABELS[locale] ?? LIST_LABELS.en;
  return EXCESS_ROWS.map((r) => `${l[r.key]} ${excessLabel(r.key, locale)}`).join(", ");
}

/** HTML list that replaces the `<!--excess-->` marker in content pages. */
export function excessListHtml(locale: string): string {
  const l = LIST_LABELS[locale] ?? LIST_LABELS.en;
  return `<ul>${EXCESS_ROWS.map((r) => `<li>${l[r.key]}: <strong>${excessLabel(r.key, locale)}</strong></li>`).join("")}</ul>`;
}

export const EXCESS_MARKER = "<!--excess-->";
export const withExcessList = (html: string, locale: string) => html.split(EXCESS_MARKER).join(excessListHtml(locale));
