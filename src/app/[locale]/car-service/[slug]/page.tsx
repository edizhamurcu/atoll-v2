import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { seo } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { ServiceIcon } from "@/components/service-icons";
import { ServiceCta } from "@/components/service-cta";
import { SERVICE_COPY, SERVICE_PAGES, servicePage } from "@/content/car-service";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return SERVICE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/car-service/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = servicePage(slug);
  if (!p) return {};
  const c = SERVICE_COPY[p.kind][locale as "en" | "tr" | "de" | "ru"] ?? SERVICE_COPY[p.kind].en;
  const path = `/car-service/${p.slug}`;
  return seo({
    title: c.title, description: c.desc,
    alternates: { canonical: `/${locale}${path}`, languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])), "x-default": `/en${path}` } },
  }, locale);
}

export default async function CarServicePage({ params }: PageProps<"/[locale]/car-service/[slug]">) {
  const { locale, slug } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const p = servicePage(slug);
  if (!p) notFound();
  const [t, n] = await Promise.all([getTranslations({ locale, namespace: "service" }), getTranslations({ locale, namespace: "nav" })]);
  const l = locale as "en" | "tr" | "de" | "ru";
  const c = SERVICE_COPY[p.kind][l];
  const others = SERVICE_PAGES.filter((o) => o.slug !== p.slug);
  return (
    <article className="mx-auto max-w-6xl px-5 pt-8" lang={locale}>
      <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: n("carSales"), href: "/car-sales" }, { name: t("hubTitle"), href: "/car-service" }, { name: c.h1, href: `/car-service/${p.slug}` }]} />
      <header className="mt-6 flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gold/25"><ServiceIcon kind={p.kind} className="size-8" /></span>
        <div>
          <h1 className="text-4xl font-extrabold md:text-5xl">{c.h1}</h1>
          <p className="mt-4 max-w-prose text-xl text-ink-soft">{c.lead}</p>
        </div>
      </header>
      <section className="mt-8 max-w-prose rounded-[var(--radius-panel)] bg-paper p-6" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-bold">{t("whyTitle")}</h2>
        <ul className="mt-4 space-y-3 text-lg text-ink-soft">
          <li className="border-l-2 border-gold/70 pl-4">{c.what}</li>
          <li className="border-l-2 border-gold/70 pl-4">{t("pointAny")}</li>
          <li className="border-l-2 border-gold/70 pl-4">{t("pointBook")}</li>
          <li className="border-l-2 border-gold/70 pl-4">{t("pointWhere")}</li>
        </ul>
        <ServiceCta className="mt-6" />
      </section>
      <section className="mt-12" aria-labelledby="others">
        <h2 id="others" className="text-2xl font-bold">{t("otherServices")}</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/car-service/${o.slug}`} className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white px-4 py-2 font-semibold hover:border-gold">
                <ServiceIcon kind={o.kind} className="size-5" />{t(`kinds.${o.kind}`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: c.h1, description: c.desc, url: `${SITE.url}/${locale}/car-service/${p.slug}`, areaServed: { "@type": "City", name: "Girne (Kyrenia)" }, serviceType: SERVICE_COPYTYPE(p.kind),
        provider: { "@type": "AutoRepair", name: "OSK Auto by Karaçay", telephone: SITE.phone.replace(/\s/g, ""), address: { "@type": "PostalAddress", streetAddress: SITE.address.street, addressLocality: `${SITE.address.locality}, ${SITE.address.region}`, addressCountry: "CY" } },
      }} />
    </article>
  );
}

const SERVICE_COPYTYPE = (k: string) => ({ MECHANICAL: "Mechanical repair", BODY: "Body repair", PAINT: "Car painting", ELECTRICAL: "Auto electrics", WASH: "Car wash" })[k] ?? k;
