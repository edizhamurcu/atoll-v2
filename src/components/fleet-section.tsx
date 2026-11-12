import { getLocale, getTranslations } from "next-intl/server";
import { getFleet, getPopularSlugs } from "@/server/queries";
import type { Locale } from "@/server/catalog";
import { money } from "@/lib/search-params";
import { trAblative } from "@/lib/tr-suffix";
import { campaignFor } from "@/content/campaigns";
import { excessLabel } from "@/content/damage-excess";
import { FleetBrowser, type FleetGroup } from "./fleet-browser";

const ORDER = ["ECONOMY", "MIDDLE", "SUV", "PEOPLE_CARRIER", "LUXURY", "PREMIUM", "SPORT"];

export async function FleetSection({ locale }: { locale: Locale }) {
  const [fleet, popular, t, tc, tx, tf, tcamp, lang] = await Promise.all([
    getFleet(locale), getPopularSlugs(), getTranslations("car"), getTranslations("classes"), getTranslations("transmission"),
    getTranslations("fleetCards"), getTranslations("campaign"), getLocale(),
  ]);
  const groups: FleetGroup[] = ORDER.map((c) => ({
    cls: c,
    label: tc(c),
    items: fleet
      .filter((m) => m.class === c)
      .map((m) => ({
        slug: m.slug,
        name: m.name,
        image: m.images[0],
        cls: m.class,
        gear: tx(m.transmission),
        automatic: m.transmission === "AUTOMATIC",
        seats: m.seats,
        seatsLabel: t("seats", { n: m.seats }),
        dailyRate: String(m.dailyRate),
        fromLabel: t("from", { price: money(m.dailyRate, locale), abl: trAblative(m.dailyRate) }),
        excess: excessLabel(m.class, lang),
        campaign: campaignFor(m.slug) !== null,
        popular: popular.has(m.slug),
      }))
      // Offer cars first, then most booked, then cheapest
      .sort((a, b) => Number(b.campaign) - Number(a.campaign) || Number(b.popular) - Number(a.popular) || Number(a.dailyRate) - Number(b.dailyRate) || a.name.localeCompare(b.name, lang)),
  })).filter((g) => g.items.length);

  const labels = {
    all: tf("all"), family: tf("family"), automatic: tf("automatic"), budget: tf("budget"), luxury: tf("luxury"), filterLabel: tf("filterLabel"),
    orSimilar: t("orSimilarShort"), unlimitedKm: tf("unlimitedKm"), airCon: t("airCon"), excess: tf("excess"), popular: tf("popular"),
    campaign: tcamp("weekShort"), perDay: t("perDayShort"), total: tf("total"), soldOut: tf("soldOut"), datesNote: tf("datesNote"), empty: tf("empty"),
    prev: tf("prev"), next: tf("next"),
  };
  return <FleetBrowser groups={groups} labels={labels} locale={locale} />;
}

export function FleetSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="w-64 shrink-0">
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-stone-deep" />
          <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-stone-deep" />
        </div>
      ))}
    </div>
  );
}
