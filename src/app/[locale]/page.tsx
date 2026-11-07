import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CyprusMap, MAP_POINTS } from "@/components/cyprus-map";
import { SearchSection, SearchSkeleton } from "@/components/search-section";
import { FleetSection, FleetSkeleton } from "@/components/fleet-section";
import type { Locale } from "@/server/catalog";

const MAP_NAMES: Record<string, Record<string, string>> = {
  en: { "alsancak-office": "Kyrenia office", "ercan-airport": "Ercan", "larnaca-airport": "Larnaca", "paphos-airport": "Paphos" },
  tr: { "alsancak-office": "Girne ofis", "ercan-airport": "Ercan", "larnaca-airport": "Larnaka", "paphos-airport": "Baf" },
  de: { "alsancak-office": "Büro Kyrenia", "ercan-airport": "Ercan", "larnaca-airport": "Larnaka", "paphos-airport": "Paphos" },
  ru: { "alsancak-office": "Офис Кирения", "ercan-airport": "Эрджан", "larnaca-airport": "Ларнака", "paphos-airport": "Пафос" },
};

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = (await params) as { locale: Locale };
  const [t, h] = await Promise.all([getTranslations("hero"), getTranslations("home")]);
  const facts = [1, 2, 3, 4] as const;
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-10 md:pt-16">
        <div className="grid items-center gap-8 md:grid-cols-[1.15fr_1fr]">
          <div>
            <h1 className="text-display font-extrabold">{t("title")}</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">{t("lead")}</p>
          </div>
          <CyprusMap title={t("mapLabel")} points={MAP_POINTS.map((p) => ({ ...p, label: MAP_NAMES[locale]?.[p.slug] ?? p.slug }))} />
        </div>
        <div id="search" className="mt-8 scroll-mt-24 md:mt-4">
          <Suspense fallback={<SearchSkeleton />}>
            <SearchSection locale={locale} />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-5" aria-labelledby="fleet">
        <h2 id="fleet" className="text-3xl font-extrabold md:text-4xl">{h("fleetTitle")}</h2>
        <p className="mt-2 max-w-xl text-ink-soft">{h("fleetLead")}</p>
        <div className="mt-8">
          <Suspense fallback={<FleetSkeleton />}>
            <FleetSection locale={locale} />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="facts">
        <h2 id="facts" className="max-w-md text-3xl font-extrabold md:text-4xl">{h("factsTitle")}</h2>
        <dl className="mt-10 grid gap-x-12 gap-y-8 border-t border-ink/10 pt-8 md:grid-cols-2">
          {facts.map((n) => (
            <div key={n}>
              <dt className="font-display text-xl font-bold">{h(`fact${n}Title`)}</dt>
              <dd className="mt-2 max-w-md text-ink-soft">{h(`fact${n}`)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
