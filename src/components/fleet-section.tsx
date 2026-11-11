import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFleet } from "@/server/queries";
import type { Locale } from "@/server/catalog";
import { CarImage } from "./car-image";
import { money } from "@/lib/search-params";
import { trAblative } from "@/lib/tr-suffix";

const ORDER = ["ECONOMY", "MIDDLE", "SUV", "PEOPLE_CARRIER", "LUXURY", "PREMIUM", "SPORT"];

export async function FleetSection({ locale }: { locale: Locale }) {
  const [fleet, t, tc, tx] = await Promise.all([getFleet(locale), getTranslations("car"), getTranslations("classes"), getTranslations("transmission")]);
  const byClass = ORDER.map((c) => ({ c, items: fleet.filter((m) => m.class === c) })).filter((g) => g.items.length);
  return (
    <div className="space-y-12">
      {byClass.map(({ c, items }) => (
        <section key={c} aria-labelledby={`cls-${c}`}>
          <h3 id={`cls-${c}`} className="mb-4 text-xl font-bold">{tc(c)}</h3>
          <ul className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:thin]">
            {items.map((m) => (
              <li key={m.slug} className="w-64 shrink-0 snap-start">
                <Link href={`/cars/${m.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <CarImage src={m.images[0]} alt={m.name} sizes="256px" />
                  </div>
                  <p className="mt-3 font-display text-lg font-bold group-hover:text-aegean">{m.name} <span className="text-sm font-normal text-ink-soft">{t("orSimilarShort")}</span></p>
                  <p className="text-sm text-ink-soft">
                    {tx(m.transmission)}, {t("seats", { n: m.seats })}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{t("from", { price: money(m.dailyRate, locale), abl: trAblative(m.dailyRate) })}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
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
