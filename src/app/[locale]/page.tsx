import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CyprusMap, MAP_POINTS } from "@/components/cyprus-map";
import { SearchSection, SearchSkeleton } from "@/components/search-section";
import { FleetSection, FleetSkeleton } from "@/components/fleet-section";
import { HeroTabs } from "@/components/hero-tabs";
import { HeroVideo } from "@/components/hero-video";
import { HeroSalePanel } from "@/components/hero-sale-panel";
import { OskSection } from "@/components/osk-section";
import { ExploreSection } from "@/components/explore-section";
import type { Locale } from "@/server/catalog";
import { LocalBusinessJsonLd } from "@/components/local-business-jsonld";
import { WHATSAPP, PHONE } from "@/lib/contact";
import { excessSummary } from "@/content/damage-excess";

const MAP_NAMES: Record<string, Record<string, string>> = {
  en: { "alsancak-office": "Kyrenia office", "ercan-airport": "Ercan", "larnaca-airport": "Larnaca", "paphos-airport": "Paphos" },
  tr: { "alsancak-office": "Girne ofis", "ercan-airport": "Ercan", "larnaca-airport": "Larnaka", "paphos-airport": "Baf" },
  de: { "alsancak-office": "Büro Kyrenia", "ercan-airport": "Ercan", "larnaca-airport": "Larnaka", "paphos-airport": "Paphos" },
  ru: { "alsancak-office": "Офис Кирения", "ercan-airport": "Эрджан", "larnaca-airport": "Ларнака", "paphos-airport": "Пафос" },
};

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = (await params) as { locale: Locale };
  const [t, h, n, ht] = await Promise.all([getTranslations("hero"), getTranslations("home"), getTranslations("nav"), getTranslations("heroTabs")]);
  const facts = [1, 2, 3, 4, 5, 6] as const;
  const steps = [1, 2, 3] as const;
  const map = <CyprusMap title={t("mapLabel")} points={MAP_POINTS.map((p) => ({ ...p, label: MAP_NAMES[locale]?.[p.slug] ?? p.slug }))} />;
  return (
    <>
      <LocalBusinessJsonLd />
      {/* Desktop: full-bleed hero over our own footage (poster + muted loop), glass search panel.
          Phones keep the light layout: no video download, map after the search form. */}
      <section className="relative md:overflow-hidden md:pb-14">
        <div aria-hidden className="absolute inset-0 hidden bg-ink bg-cover bg-center md:block" style={{ backgroundImage: "url(/media/video/hero-poster.webp)" }}>
          <HeroVideo src="/media/video/hero-loop-720.mp4" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/25" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/50 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pt-10 md:pt-24">
          <div className="max-w-2xl">
            <h1 className="text-display font-extrabold md:text-white">{t("title")}</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft md:text-white/85">{t("lead")}</p>
          </div>
          <div id="search" className="hero-glass mt-8 scroll-mt-24 md:mt-10">
            <HeroTabs
              rentLabel={ht("rent")}
              saleLabel={ht("sale")}
              groupLabel={ht("label")}
              rent={
                <Suspense fallback={<SearchSkeleton />}>
                  <SearchSection locale={locale} />
                </Suspense>
              }
              sale={<HeroSalePanel />}
            />
          </div>
          <div className="mt-8 md:hidden">{map}</div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-5" aria-labelledby="steps">
        <h2 id="steps" className="text-3xl font-extrabold md:text-4xl">{h("stepsTitle")}</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map((n) => (
            <li key={n} className="relative pl-14">
              <span aria-hidden className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full bg-ink font-display text-lg font-bold text-white">{n}</span>
              <h3 className="text-xl font-bold">{h(`step${n}Title`)}</h3>
              <p className="mt-2 text-ink-soft">{h(`step${n}`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="fleet">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-bougain/10 px-3 py-1 text-sm font-semibold text-bougain-deep"><span aria-hidden className="size-2 rounded-full bg-bougain" />{n("rentCars")}</p>
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
        <dl className="mt-10 grid gap-x-12 gap-y-8 border-t border-ink/10 pt-8 md:grid-cols-2 lg:grid-cols-3">
          {facts.map((n) => (
            <div key={n}>
              <dt className="font-display text-xl font-bold">{h(`fact${n}Title`)}</dt>
              <dd className="mt-2 max-w-md text-ink-soft">{n === 4 ? h("fact4", { excess: excessSummary(locale) }) : h(`fact${n}`)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <OskSection />
      <ExploreSection locale={locale} />

      <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="cta">
        <div className="flex flex-col gap-6 rounded-[var(--radius-panel)] bg-ink px-6 py-10 text-white md:flex-row md:items-center md:justify-between md:px-10">
          <div className="max-w-xl">
            <h2 id="cta" className="text-3xl font-extrabold">{h("ctaTitle")}</h2>
            <p className="mt-3 text-white/75">{h("ctaLead")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="btn-primary">{h("ctaCall", { phone: PHONE })}</a>
            <a href={`https://wa.me/${WHATSAPP.replace(/\D/g, "")}`} className="inline-flex items-center rounded-full border border-white/30 px-5 py-3 font-medium hover:border-white" rel="noopener">{h("ctaWhatsapp")}</a>
          </div>
        </div>
      </section>
    </>
  );
}
