import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getPage, faqFromHtml, plainText } from "@/server/pages";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { pageTranslation, translatedLocales } from "@/content/page-i18n";
import { HOSTS, dropAgreementTeaser, rewriteMergedLinks } from "@/content/page-merge";
import { withExcessList } from "@/content/damage-excess";
import { AboutVideo } from "@/components/about-video";
import { SpecialOffers } from "@/components/campaign";

export async function generateMetadata({ params }: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getPage(slug);
  if (!p) return {};
  const tr = pageTranslation(slug, locale);
  const title = HOSTS[slug] ? (await getTranslations({ locale, namespace: "nav" }))("rentalTerms") : tr?.title ?? p.metaTitle ?? p.title;
  const description = tr?.metaDescription ?? (tr ? plainText(tr.html) : p.metaDescription || plainText(p.html));
  const desc = slug === "special-offers" ? (await getTranslations({ locale, namespace: "campaign" }))("metaDescription") : description;
  const langs = ["en", ...translatedLocales(slug)];
  // A page is indexable in every language it has been translated into; elsewhere it shows English and points to /en.
  const own = locale === "en" || !!tr;
  const url = `/${own ? locale : "en"}/${slug}`;
  return seo({
    title,
    description: desc,
    alternates: { canonical: url, languages: { ...Object.fromEntries(langs.map((l) => [l, `/${l}/${slug}`])), "x-default": `/en/${slug}` } },
    robots: own ? undefined : { index: false, follow: true },
    openGraph: { title, description: desc, url, type: "article" },
  }, locale);
}

export default function ContentPage({ params }: PageProps<"/[locale]/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-3xl animate-pulse px-5 pt-10" />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[locale]/[slug]">["params"] }) {
  const { locale, slug } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const p = await getPage(slug);
  if (!p) notFound();
  const tr = pageTranslation(slug, locale);
  const nav = await getTranslations({ locale, namespace: "nav" });
  const merged = HOSTS[slug] ?? [];
  const title = merged.length ? nav("rentalTerms") : tr?.title ?? p.title;
  let body = tr?.html ?? p.html;
  // Pages merged into this one (rental agreement under rental terms), each under its own anchored heading.
  for (const m of merged) {
    const mp = await getPage(m);
    if (!mp) continue;
    const mt = pageTranslation(m, locale);
    body = `${dropAgreementTeaser(body)}\n<h2 id="agreement" class="scroll-mt-28">${nav("agreement")}</h2>\n${mt?.html ?? mp.html}`;
  }
  const html = rewriteMergedLinks(withExcessList(body, locale));
  const lang = tr ? locale : "en";
  const faq = faqFromHtml(html);
  return (
    <article className="mx-auto max-w-3xl px-5 pt-8" lang={lang}>
      <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: title, href: `/${slug}` }]} />
      <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">{title}</h1>
      {slug === "about-us" && <AboutVideo />}
      {/* Special offers: the old WordPress body (stock photo + "no offers at the moment") is replaced by the live campaigns. */}
      {slug === "special-offers" ? <SpecialOffers locale={locale} /> : <div className="prose-atoll mt-8" dangerouslySetInnerHTML={{ __html: html }} />}
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebPage", name: title, url: `${SITE.url}/${lang}/${slug}`, inLanguage: lang, dateModified: p.updatedAt.toISOString(), isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url } },
          ...(faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: lang, mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
        ]}
      />
    </article>
  );
}
