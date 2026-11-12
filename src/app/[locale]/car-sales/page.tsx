import type { Metadata } from "next";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { Suspense } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { Link } from "@/i18n/navigation";
import { SaleStockSection } from "@/components/sale-stock-section";
import { SITE, telLink, waLink } from "@/lib/site";
import { routing } from "@/i18n/routing";

const IMG = "/media/osk";
const GALLERY = [
  ["showroom-mercedes", "mercedes"],
  ["showroom-bmw-x6", "bmwX6"],
  ["showroom-bmw", "bmw"],
  ["showroom-hall", "hall"],
] as const;
const AFTER = [
  ["workshop", "workshop", "oskWorkshop"],
  ["body-repair", "body", "oskBody"],
  ["car-wash", "wash", "oskWash"],
] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/car-sales">): Promise<Metadata> {
  const { locale } = await params;
  const s = await getTranslations({ locale, namespace: "sales" });
  const languages = { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}/car-sales`])), "x-default": "/en/car-sales" };
  return {
    title: { absolute: s("metaTitle") },
    description: s("metaDescription"),
    alternates: { canonical: `/${locale}/car-sales`, languages },
    openGraph: { title: s("metaTitle"), description: s("metaDescription"), url: `/${locale}/car-sales`, images: [`${IMG}/showroom-mercedes.webp`] },
  };
}

export default async function CarSalesPage({ params }: PageProps<"/[locale]/car-sales">) {
  const { locale } = await params;
  const [s, h] = await Promise.all([getTranslations("sales"), getTranslations("home")]);
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8">
      <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: s("title"), href: "/car-sales" }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <Image src="/brand/osk-auto.svg" alt="OSK Auto by Karaçay" width={353} height={206} unoptimized priority className="h-16 w-auto" />
          <h1 className="mt-5 text-4xl font-extrabold md:text-5xl">{s("title")}</h1>
          <p className="mt-4 text-lg text-ink-soft">{s("lead")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={telLink(SITE.phone)} className="btn-primary">{s("callCta", { phone: SITE.phone })}</a>
            <a href={waLink(s("waText"))} className="btn-wa" target="_blank" rel="noopener"><WhatsAppIcon />{s("waCta")}</a>
          </div>
        </div>
        <Image src={`${IMG}/showroom-mercedes.webp`} alt={s("imgAlt.mercedes")} width={1440} height={1080} priority sizes="(min-width: 1024px) 600px, 100vw" className="aspect-[4/3] w-full rounded-2xl object-cover" />
      </div>

      <section className="mt-20" aria-labelledby="gallery">
        <h2 id="gallery" className="text-3xl font-extrabold">{s("galleryTitle")}</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {GALLERY.map(([file, alt]) => (
            <li key={file}>
              <Image src={`${IMG}/${file}.webp`} alt={s(`imgAlt.${alt}`)} width={1440} height={1080} sizes="(min-width: 768px) 280px, 50vw" className="aspect-[4/3] w-full rounded-xl object-cover" />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink-soft">{s("galleryNote")}</p>
      </section>

      <Suspense fallback={<span id="stock" />}>
        <SaleStockSection locale={locale} />
      </Suspense>

      <div className="mt-20 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="why">
          <h2 id="why" className="text-3xl font-extrabold">{s("whyTitle")}</h2>
          <ul className="mt-6 space-y-4">
            {(["why1", "why2", "why3", "why4"] as const).map((k) => (
              <li key={k} className="border-l-2 border-gold/70 pl-4 text-lg text-ink-soft">{s(k)}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="stock-contact" className="rounded-[var(--radius-panel)] bg-paper p-7">
          <h2 id="stock-contact" className="text-2xl font-bold">{s("stockTitle")}</h2>
          <p className="mt-3 text-ink-soft">{s("stockText")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={telLink(SITE.phone)} className="btn-primary">{s("callCta", { phone: SITE.phone })}</a>
            <a href={waLink(s("waText"))} className="btn-wa" target="_blank" rel="noopener"><WhatsAppIcon />{s("waCta")}</a>
            <Link href="/contact" className="btn-quiet">{s("contactCta")}</Link>
          </div>
          <p className="mt-4 text-sm text-ink-soft">{SITE.phone} · {SITE.phone2}</p>
        </section>
      </div>

      <section className="mt-20" aria-labelledby="after">
        <h2 id="after" className="text-3xl font-extrabold">{s("servicesTitle")}</h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-3">
          {AFTER.map(([file, alt, title]) => (
            <li key={file}>
              <Image src={`${IMG}/${file}.webp`} alt={s(`imgAlt.${alt}`)} width={1440} height={1080} sizes="(min-width: 768px) 360px, 100vw" className="aspect-[4/3] w-full rounded-xl object-cover" />
              <h3 className="mt-3 text-lg font-bold">{h(title)}</h3>
              <p className="text-ink-soft">{h(`${title}Text` as "oskWorkshopText")}</p>
            </li>
          ))}
        </ul>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AutoDealer",
          name: "OSK Auto by Karaçay",
          url: `${SITE.url}/${locale}/car-sales`,
          image: `${SITE.url}${IMG}/showroom-mercedes.webp`,
          telephone: SITE.phone.replace(/\s/g, ""),
          address: { "@type": "PostalAddress", streetAddress: SITE.address.street, addressLocality: `${SITE.address.locality}, ${SITE.address.region}`, addressCountry: "CY" },
          geo: { "@type": "GeoCoordinates", latitude: SITE.address.lat, longitude: SITE.address.lng },
          department: { "@type": "AutoRental", name: SITE.name, url: SITE.url },
          makesOffer: ["New and used car sales", "Car wash", "Body and paint", "Mechanical repair", "Auto electrics"].map((n) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: n } })),
        }}
      />
    </div>
  );
}
