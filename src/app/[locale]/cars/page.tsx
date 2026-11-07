import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchSection, SearchSkeleton } from "@/components/search-section";
import { Results } from "@/components/results";
import { FleetSection, FleetSkeleton } from "@/components/fleet-section";
import type { Locale } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/[locale]/cars">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "results" });
  return { title: t("title"), alternates: { canonical: `/${locale}/cars` } };
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
