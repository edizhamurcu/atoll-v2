import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getExtras, getModel } from "@/server/queries";
import type { Locale } from "@/server/catalog";
import { CarGallery } from "@/components/car-gallery";
import { BookingPanel } from "@/components/booking-panel";
import { CampaignBanner } from "@/components/campaign";
import { SearchSection, SearchSkeleton } from "@/components/search-section";
import { money } from "@/lib/search-params";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { localizedRentalInfo } from "@/content/rental-info";
import { excessLabel } from "@/content/damage-excess";
import { trAblative } from "@/lib/tr-suffix";

export async function generateMetadata({ params }: PageProps<"/[locale]/cars/[slug]">): Promise<Metadata> {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const m = await getModel(slug, locale);
  if (!m) return {};
  const [t, tx, tf] = await Promise.all([getTranslations({ locale, namespace: "car" }), getTranslations({ locale, namespace: "transmission" }), getTranslations({ locale, namespace: "fuel" })]);
  const price = money(m.dailyRate, locale);
  const abl = trAblative(m.dailyRate);
  const title = t("metaTitle", { name: m.name, price, abl });
  const description = t("metaDesc", { name: m.name, price, abl, seats: m.seats, gear: tx(m.transmission).toLocaleLowerCase(locale), fuel: tf(m.fuel).toLocaleLowerCase(locale) });
  return {
    title, description,
    alternates: { canonical: `/${locale}/cars/${slug}`, languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}/cars/${slug}`])), "x-default": `/en/cars/${slug}` } },
    openGraph: { title, description, images: m.images[0] ? [{ url: m.images[0] }] : undefined },
  };
}

export default function CarPage({ params }: PageProps<"/[locale]/cars/[slug]">) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-stone-deep" />}>
        <CarDetail params={params} />
      </Suspense>
    </div>
  );
}

async function CarDetail({ params }: { params: PageProps<"/[locale]/cars/[slug]">["params"] }) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const [m, extras] = await Promise.all([getModel(slug, locale), getExtras(locale)]);
  if (!m) notFound();
  const [t, tc, tx, tf, tb, tcol] = await Promise.all([getTranslations("car"), getTranslations("classes"), getTranslations("transmission"), getTranslations("fuel"), getTranslations("bodyType"), getTranslations("colors")]);
  const color = (c: string) => (tcol.has(c as never) ? tcol(c as never) : c);
  const info = m.description ? localizedRentalInfo(m.description, locale, excessLabel(m.class, locale)) : null;
  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div className="min-w-0">
        <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: tc(m.class), href: "/cars" }, { name: m.name, href: `/cars/${slug}` }]} />
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "Car", name: m.name, brand: { "@type": "Brand", name: m.make }, model: m.model,
          vehicleTransmission: m.transmission === "AUTOMATIC" ? "AutomaticTransmission" : "ManualTransmission",
          fuelType: m.fuel, seatingCapacity: m.seats, image: m.images.map((i) => `${SITE.url}${i}`), url: `${SITE.url}/${locale}/cars/${slug}`,
          offers: { "@type": "Offer", priceCurrency: "GBP", price: m.dailyRate, availability: "https://schema.org/InStock", businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
            priceSpecification: { "@type": "UnitPriceSpecification", price: m.dailyRate, priceCurrency: "GBP", unitCode: "DAY" }, seller: { "@id": `${SITE.url}/#business` } },
        }} />
        <p className="mt-4 text-ink-soft">{tc(m.class)}</p>
        <h1 className="text-4xl font-extrabold md:text-5xl">{m.name}</h1>
        <p className="text-lg text-ink-soft">{t("orSimilarShort")}</p>
        <div className="mt-6">
          <CarGallery images={m.images} alt={m.name} />
        </div>

        <h2 className="mt-10 text-2xl font-bold">{t("allSpecs")}</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {[
            [t("classLabel"), tc(m.class)],
            [t("typeLabel"), tb(m.bodyType)],
            [t("acLabel"), m.airCon ? t("yes") : t("no")],
            [t("fuelLabel"), tf(m.fuel)],
            [t("gearLabel"), tx(m.transmission)],
            [t("seatsLabel"), String(m.seats)],
            ...(m.engineLitres ? [[t("engineLabel"), `${m.engineLitres} L`]] : []),
            ...(m.years ? [[t("yearsLabel"), m.years.min === m.years.max ? String(m.years.min) : `${m.years.min}–${m.years.max}`]] : []),
            ...(m.colors.length ? [[t("colorsLabel"), m.colors.map(color).join(", ")]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-ink/8 py-2.5">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        {m.vehicles.length > 0 && (
          <section className="mt-10" aria-labelledby="fleet-table">
            <h2 id="fleet-table" className="text-2xl font-bold">{t("fleetTable")} <span className="font-normal text-ink-soft">({m.vehicles.length})</span></h2>
            <div className="mt-4 overflow-x-auto rounded-2xl bg-paper">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink/10 text-ink-soft"><tr><th scope="col" className="px-4 py-2.5 font-medium">{t("plate")}</th><th scope="col" className="px-4 py-2.5 font-medium">{t("year")}</th><th scope="col" className="px-4 py-2.5 font-medium">{t("color")}</th></tr></thead>
                <tbody>
                  {m.vehicles.map((v) => (
                    <tr key={v.plate} className="border-b border-ink/5"><td className="px-4 py-2.5 font-medium tabular-nums">{v.plate}</td><td className="px-4 py-2.5">{v.year ?? "—"}</td><td className="px-4 py-2.5">{v.color ? color(v.color) : "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {info && (
          <section className="mt-10" aria-labelledby="rental-info">
            <h2 id="rental-info" className="text-2xl font-bold">{t("rentalInfo")}</h2>
            <div className="prose-atoll mt-2" lang={info.lang} dangerouslySetInnerHTML={{ __html: info.html }} />
          </section>
        )}
        <p className="mt-6 max-w-prose text-sm text-ink-soft">{t("orSimilar", { name: m.name })}</p>
      </div>
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-panel)] bg-paper p-5 shadow-[0_18px_40px_-24px_rgba(13,52,64,.35)]">
          <h2 className="text-2xl font-bold">{t("bookPanel")}</h2>
          <p className="mt-1 text-ink-soft">{t("from", { price: money(m.dailyRate, locale), abl: trAblative(m.dailyRate) })}</p>
          <div className="mt-4"><CampaignBanner slug={slug} /></div>
          <div className="mt-4">
            <Suspense fallback={<SearchSkeleton />}>
              <SearchSection locale={locale} target={`/cars/${slug}`} stacked />
            </Suspense>
          </div>
          <div className="mt-6">
            <Suspense>
              <BookingPanel slug={slug} extras={extras} />
            </Suspense>
          </div>
        </div>
      </aside>
    </div>
  );
}

