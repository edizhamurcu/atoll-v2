import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { seo, seoAlternates } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { ServiceIcon } from "@/components/service-icons";
import { ServiceCta } from "@/components/service-cta";
import { SERVICE_COPY, SERVICE_PAGES } from "@/content/car-service";
import { SITE } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/car-service">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "service" });
  return seo({ title: t("hubMetaTitle"), description: t("hubMeta"), alternates: seoAlternates(locale, "/car-service") }, locale);
}

export default async function CarServiceHub({ params }: PageProps<"/[locale]/car-service">) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const [t, n] = await Promise.all([getTranslations({ locale, namespace: "service" }), getTranslations({ locale, namespace: "nav" })]);
  const l = locale as "en" | "tr" | "de" | "ru";
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8" lang={locale}>
      <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: n("carSales"), href: "/car-sales" }, { name: t("hubTitle"), href: "/car-service" }]} />
      <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">{t("hubTitle")}</h1>
      <p className="mt-4 max-w-prose text-xl text-ink-soft">{t("hubLead")}</p>
      <ServiceCta className="mt-6" />
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_PAGES.map(({ slug, kind }) => (
          <li key={slug} className="flex flex-col rounded-[var(--radius-panel)] border border-gold/30 bg-paper p-6">
            <span className="grid size-12 place-items-center rounded-full bg-gold/25"><ServiceIcon kind={kind} className="size-7" /></span>
            <h2 className="mt-4 text-xl font-bold"><Link href={`/car-service/${slug}`} className="hover:underline">{SERVICE_COPY[kind][l].h1}</Link></h2>
            <p className="mt-2 grow text-ink-soft">{SERVICE_COPY[kind][l].lead}</p>
            <Link href={`/car-service/${slug}`} className="mt-4 font-semibold text-bougain underline-offset-2 hover:underline">{t("viewService")}</Link>
          </li>
        ))}
      </ul>
      <section className="mt-14 rounded-[var(--radius-panel)] bg-ink p-7 text-white" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-extrabold">{t("whyTitle")}</h2>
        <ul className="mt-4 space-y-2 text-white/90">
          <li>{t("pointAny")}</li>
          <li>{t("pointBook")}</li>
          <li>{t("pointWhere")}</li>
        </ul>
      </section>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "AutoRepair", name: "OSK Auto by Karaçay", url: `${SITE.url}/${locale}/car-service`, telephone: SITE.phone.replace(/\s/g, ""),
        address: { "@type": "PostalAddress", streetAddress: SITE.address.street, addressLocality: `${SITE.address.locality}, ${SITE.address.region}`, addressCountry: "CY" },
        geo: { "@type": "GeoCoordinates", latitude: SITE.address.lat, longitude: SITE.address.lng },
        hasOfferCatalog: { "@type": "OfferCatalog", name: t("hubTitle"), itemListElement: SERVICE_PAGES.map(({ slug, kind }) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: SERVICE_COPY[kind][l].h1, url: `${SITE.url}/${locale}/car-service/${slug}` } })) },
      }} />
    </div>
  );
}
