import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact-form";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SITE, telLink, waLink } from "@/lib/site";
import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("contactTitle"), description: t("contactLead"), alternates: { canonical: `/${locale}/contact`, languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/contact`])) } };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  const [t, f, b] = await Promise.all([getTranslations("contact"), getTranslations("footer"), getTranslations("booking")]);
  const map = `https://www.openstreetmap.org/export/embed.html?bbox=${SITE.address.lng - 0.01}%2C${SITE.address.lat - 0.006}%2C${SITE.address.lng + 0.01}%2C${SITE.address.lat + 0.006}&layer=mapnik&marker=${SITE.address.lat}%2C${SITE.address.lng}`;
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8">
      <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: t("contactTitle"), href: "/contact" }]} />
      <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">{t("contactTitle")}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">{t("contactLead")}</p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="form-title" className="rounded-[var(--radius-panel)] bg-paper p-6">
          <h2 id="form-title" className="mb-5 text-2xl font-bold">{t("formTitle")}</h2>
          <ContactForm />
        </section>
        <section aria-labelledby="office" className="space-y-4">
          <h2 id="office" className="text-2xl font-bold">{t("office")}</h2>
          <address className="not-italic">
            <p>{f("address")}</p>
            <p className="mt-1 text-sm text-ink-soft">{f("hours")}</p>
          </address>
          <div className="flex flex-wrap gap-3">
            <a className="btn-primary" href={telLink(SITE.phone)}>{SITE.phone}</a>
            <a className="btn-quiet" href={waLink()} rel="noopener">{b("whatsapp")}</a>
            <a className="btn-quiet" href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </div>
          <iframe title="Atoll Rent A Car office map" src={map} loading="lazy" className="aspect-[4/3] w-full rounded-2xl border border-ink/10" referrerPolicy="no-referrer" />
        </section>
      </div>
    </div>
  );
}
