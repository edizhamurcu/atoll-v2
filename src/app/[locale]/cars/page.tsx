import { Suspense } from "react";
import type { Metadata } from "next";
import { seo, seoAlternates } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import { SearchSection, SearchSkeleton } from "@/components/search-section";
import { Results } from "@/components/results";
import { FleetSection, FleetSkeleton } from "@/components/fleet-section";
import type { Locale } from "@/server/catalog";
import { getFleet } from "@/server/queries";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/cars">): Promise<Metadata> {
  const { locale } = await params;
  const [t, h] = await Promise.all([getTranslations({ locale, namespace: "results" }), getTranslations({ locale, namespace: "home" })]);
  return seo({ title: t("fleetMetaTitle"), description: t("fleetMetaDesc"), alternates: seoAlternates(locale, "/cars"), openGraph: { title: t("fleetMetaTitle"), description: h("fleetLead"), url: `/${locale}/cars` } }, locale);
}

export default async function CarsPage({ params, searchParams }: PageProps<"/[locale]/cars">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations("results");
  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <h1 className="text-4xl font-extrabold md:text-5xl">{t("title")}</h1>
      <div className="mt-6">
        <Suspense fallback={<SearchSkeleton />}>
          <SearchSection locale={locale} compact />
        </Suspense>
      </div>
      <div className="mt-10">
        <Suspense fallback={<p className="text-ink-soft">{t("loading")}</p>}>
          <ResultsOrFleet locale={locale} searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={null}>
          <FleetJsonLd locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}

async function ResultsOrFleet({ locale, searchParams }: { locale: Locale; searchParams: PageProps<"/[locale]/cars">["searchParams"] }) {
  const sp = await searchParams;
  if (sp.pickupAt && sp.returnAt && sp.pickupLocation) return <Results />;
  return (
    <Suspense fallback={<FleetSkeleton />}>
      <FleetSection locale={locale} />
    </Suspense>
  );
}

/** ItemList of every rental model, so search and AI engines see the whole fleet on the fleet page. */
async function FleetJsonLd({ locale }: { locale: Locale }) {
  const fleet = await getFleet(locale);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${SITE.name} — rental cars`,
        numberOfItems: fleet.length,
        itemListElement: fleet.map((m, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE.url}/${locale}/cars/${m.slug}`,
          name: m.name,
        })),
      }}
    />
  );
}
