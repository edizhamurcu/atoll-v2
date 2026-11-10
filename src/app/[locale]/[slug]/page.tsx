import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, faqFromHtml, plainText } from "@/server/pages";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { pageTranslation, translatedLocales } from "@/content/page-i18n";
import { withExcessList } from "@/content/damage-excess";
import { AboutVideo } from "@/components/about-video";

export async function generateMetadata({ params }: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getPage(slug);
  if (!p) return {};
  const tr = pageTranslation(slug, locale);
  const title = tr?.title ?? p.metaTitle ?? p.title;
  const description = tr?.metaDescription ?? (tr ? plainText(tr.html) : p.metaDescription || plainText(p.html));
  const langs = ["en", ...translatedLocales(slug)];
  // A page is indexable in every language it has been translated into; elsewhere it shows English and points to /en.
  const own = locale === "en" || !!tr;
  const url = `/${own ? locale : "en"}/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url, languages: { ...Object.fromEntries(langs.map((l) => [l, `/${l}/${slug}`])), "x-default": `/en/${slug}` } },
    robots: own ? undefined : { index: false, follow: true },
    openGraph: { title, description, url, type: "article" },
  };
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
  const title = tr?.title ?? p.title;
  const html = withExcessList(tr?.html ?? p.html, locale);
  const lang = tr ? locale : "en";
  const faq = faqFromHtml(html);
  return (
    <article className="mx-auto max-w-3xl px-5 pt-8" lang={lang}>
      <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: title, href: `/${slug}` }]} />
      <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">{title}</h1>
      {slug === "about-us" && <AboutVideo />}
      <div className="prose-atoll mt-8" dangerouslySetInnerHTML={{ __html: html }} />
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebPage", name: title, url: `${SITE.url}/${lang}/${slug}`, inLanguage: lang, dateModified: p.updatedAt.toISOString(), isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url } },
          ...(faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: lang, mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
        ]}
      />
    </article>
  );
}
