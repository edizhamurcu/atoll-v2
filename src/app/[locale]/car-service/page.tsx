import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { seo, seoAlternates } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { Glyph, ServiceIcon, ServiceMenu, type GlyphName } from "@/components/service-icons";
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
  const chips: [GlyphName, string][] = [["car", t("chipAny")], ["ticket", t("chipQueue")], ["pin", t("chipBuilding")]];
  const steps: [GlyphName, string, string][] = [["request", t("step1T"), t("step1D")], ["ticket", t("step2T"), t("step2D")], ["calendar", t("step3T"), t("step3D")], ["key", t("step4T"), t("step4D")]];
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8" lang={locale}>
      <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: n("carSales"), href: "/car-sales" }, { name: t("hubTitle"), href: "/car-service" }]} />
      <header className="mt-6 overflow-hidden rounded-[var(--radius-panel)] bg-ink bg-[radial-gradient(circle_at_85%_0%,rgba(196,163,86,.28),transparent_55%)] p-7 text-white md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[.14em] text-gold">{t("hubEyebrow")}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold md:text-5xl">{t("hubTitle")}</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/85 md:text-xl">{t("hubLead")}</p>
        <ul className="mt-6 flex flex-wrap gap-2.5">
          {chips.map(([g, label]) => (
            <li key={label} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium"><Glyph name={g} className="size-4 text-gold" />{label}</li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/car-sales#service-request" className="btn-primary">{t("reserveCta")}</Link>
          <Link href="/car-sales#service-track" className="inline-flex items-center rounded-full border border-white/30 px-5 py-3 font-semibold text-white hover:bg-white/10">{t("trackCta")}</Link>
        </div>
      </header>
      <ServiceMenu className="mt-6" />
      <section className="mt-10" aria-labelledby="svc">
        <h2 id="svc" className="text-2xl font-extrabold md:text-3xl">{t("servicesTitle")}</h2>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_PAGES.map(({ slug, kind }) => (
            <li key={slug}>
              <Link href={`/car-service/${slug}`} className="group flex h-full flex-col rounded-[var(--radius-panel)] border border-ink/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2">
                <span className="grid size-16 place-items-center rounded-2xl bg-ink text-gold"><ServiceIcon kind={kind} className="size-10" /></span>
                <h3 className="mt-5 text-xl font-bold">{t(`kinds.${kind}`)}</h3>
                <p className="mt-2 grow text-ink-soft">{SERVICE_COPY[kind][l].lead}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-bougain">{t("viewService")}<span aria-hidden className="transition-transform group-hover:translate-x-1">→</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-14" aria-labelledby="proc">
        <h2 id="proc" className="text-2xl font-extrabold md:text-3xl">{t("processTitle")}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([g, title, text], i) => (
            <li key={title} className="relative rounded-[var(--radius-panel)] bg-paper p-6">
              <span className="absolute right-5 top-4 text-4xl font-extrabold text-ink/10" aria-hidden>{i + 1}</span>
              <span className="grid size-11 place-items-center rounded-full bg-gold/25 text-ink"><Glyph name={g} className="size-6" /></span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-14 flex flex-col gap-5 rounded-[var(--radius-panel)] border border-gold/40 bg-gold/10 p-7 md:flex-row md:items-center md:justify-between" aria-labelledby="cta">
        <div className="max-w-xl">
          <h2 id="cta" className="flex items-center gap-2.5 text-2xl font-extrabold"><Glyph name="shield" className="size-7 text-ink" />{t("ctaTitle")}</h2>
          <p className="mt-2 text-ink-soft">{t("ctaText")}</p>
        </div>
        <ServiceCta />
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
