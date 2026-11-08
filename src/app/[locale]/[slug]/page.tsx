import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, faqFromHtml, plainText } from "@/server/pages";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";
import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getPage(slug);
  if (!p) return {};
  const description = p.metaDescription || plainText(p.html);
  return {
    title: p.metaTitle || p.title,
    description,
    // Source text is English: canonical is the /en page, other locales point to it.
    alternates: { canonical: `/en/${slug}`, languages: { en: `/en/${slug}`, "x-default": `/en/${slug}` } },
    robots: locale === "en" ? undefined : { index: false, follow: true },
    openGraph: { title: p.title, description, url: `/en/${slug}`, type: "article" },
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
  const faq = faqFromHtml(p.html);
  return (
    <article className="mx-auto max-w-3xl px-5 pt-8" lang="en">
      <Breadcrumbs items={[{ name: "Atoll Rent A Car", href: "/" }, { name: p.title, href: `/${slug}` }]} />
      <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">{p.title}</h1>
      <div className="prose-atoll mt-8" dangerouslySetInnerHTML={{ __html: p.html }} />
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebPage", name: p.title, url: `${SITE.url}/en/${slug}`, inLanguage: "en", dateModified: p.updatedAt.toISOString(), isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url } },
          ...(faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
        ]}
      />
    </article>
  );
}
