import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFleet } from "@/server/queries";
import type { Locale } from "@/server/catalog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { money } from "@/lib/search-params";
import { SITE } from "@/lib/site";
import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/car-prices">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("pricesTitle"), description: t("pricesLead"), alternates: { canonical: `/${locale}/car-prices`, languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/car-prices`])) } };
}

export default async function CarPrices({ params }: PageProps<"/[locale]/car-prices">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations("contact");
  return (
    <div className="mx-auto max-w-4xl px-5 pt-8">
      <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: t("pricesTitle"), href: "/car-prices" }]} />
      <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">{t("pricesTitle")}</h1>
      <p className="mt-4 text-lg text-ink-soft">{t("pricesLead")}</p>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-stone-deep" />}>
        <Table locale={locale} />
      </Suspense>
    </div>
  );
}

async function Table({ locale }: { locale: Locale }) {
  const [fleet, t, tc, tx] = await Promise.all([getFleet(locale), getTranslations("contact"), getTranslations("classes"), getTranslations("transmission")]);
  return (
    <>
      <div className="mt-8 overflow-x-auto rounded-2xl bg-paper">
        <table className="w-full text-left">
          <caption className="sr-only">{t("pricesTitle")}</caption>
          <thead className="border-b border-ink/10 text-sm text-ink-soft"><tr><th scope="col" className="px-4 py-3 font-medium">{t("model")}</th><th scope="col" className="px-4 py-3 font-medium">{t("class")}</th><th scope="col" className="px-4 py-3 text-right font-medium">{t("perDay")}</th></tr></thead>
          <tbody>
            {fleet.map((m) => (
              <tr key={m.slug} className="border-b border-ink/5">
                <th scope="row" className="px-4 py-3 font-semibold"><Link href={`/cars/${m.slug}`} className="hover:text-aegean">{m.name}</Link><span className="block text-sm font-normal text-ink-soft">{tx(m.transmission)}, {m.seats}</span></th>
                <td className="px-4 py-3 text-ink-soft">{tc(m.class)}</td>
                <td className="px-4 py-3 text-right font-display text-lg font-bold tabular-nums">{money(m.dailyRate, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/cars" className="btn-primary mt-6">{t("book")}</Link>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "OfferCatalog", name: `${SITE.name} — car prices`, itemListElement: fleet.map((m) => ({ "@type": "Offer", itemOffered: { "@type": "Car", name: m.name }, priceSpecification: { "@type": "UnitPriceSpecification", price: m.dailyRate, priceCurrency: "GBP", unitCode: "DAY" } })) }} />
    </>
  );
}
