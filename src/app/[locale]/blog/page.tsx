import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { PHOTOS, photoAlt } from "@/content/photos";
import { BLOG_LOCALES, fmtDate, posts, readingMinutes } from "@/content/blog";
import { SITE } from "@/lib/site";
import { TravelNav } from "@/components/travel-nav";
import { GuideCards } from "@/components/explore-section";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const url = `/${locale}/blog`;
  return seo({
    title: t("title"),
    description: t("description"),
    alternates: { canonical: url, languages: { ...Object.fromEntries(BLOG_LOCALES.map((l) => [l, `/${l}/blog`])), "x-default": "/en/blog" }, types: { "application/rss+xml": "/blog/feed.xml" } },
    openGraph: { title: t("title"), description: t("description"), url, type: "website" },
  }, locale);
}

export default async function BlogIndex({ params }: PageProps<"/[locale]/blog">) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const [t, n, tv] = await Promise.all([getTranslations({ locale, namespace: "blog" }), getTranslations({ locale, namespace: "nav" }), getTranslations({ locale, namespace: "travel" })]);
  const all = posts(locale);
  const [first, ...rest] = all;
  const meta = (iso: string, minutes: number, className = "") => (
    <p className={`text-sm text-ink-soft ${className}`}>
      <time dateTime={iso}>{fmtDate(iso, locale)}</time> <span aria-hidden>·</span> {t("minRead", { n: minutes })}
    </p>
  );
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8" lang={locale}>
      <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: n("blog"), href: "/blog" }]} />
      <header className="mt-4 max-w-3xl">
        <h1 className="text-display font-extrabold">{t("title")}</h1>
        <p className="mt-4 text-lg text-ink-soft">{tv("hubLead")}</p>
      </header>
      <TravelNav active="posts" className="mt-6" />

      <div className="mt-10"><GuideCards locale={locale} priority /></div>

      <h2 id="posts" className="mt-16 scroll-mt-28 text-3xl font-extrabold">{tv("postsTitle")}</h2>
      {first && (
        <Link href={`/blog/${first.slug}`} className="group mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-center">
          <Image src={PHOTOS[first.cover].src} alt={photoAlt(first.cover, locale)} width={PHOTOS[first.cover].w} height={PHOTOS[first.cover].h} sizes="(min-width: 768px) 640px, 100vw" className="aspect-[3/2] w-full rounded-panel bg-stone-deep object-cover" />
          <div>
            {meta(first.published, readingMinutes(first))}
            <h3 className="mt-2 text-3xl font-extrabold leading-tight group-hover:text-aegean md:text-4xl">{first.title}</h3>
            <p className="mt-3 text-lg text-ink-soft">{first.description}</p>
          </div>
        </Link>
      )}

      <ul className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="group block">
              <Image src={PHOTOS[p.cover].src} alt={photoAlt(p.cover, locale)} width={PHOTOS[p.cover].w} height={PHOTOS[p.cover].h} sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw" className="aspect-[3/2] w-full rounded-panel bg-stone-deep object-cover" />
              {meta(p.published, readingMinutes(p), "mt-4")}
              <h3 className="mt-1 text-xl font-bold leading-snug group-hover:text-aegean">{p.title}</h3>
              <p className="mt-2 text-ink-soft">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: t("title"),
          description: t("description"),
          url: `${SITE.url}/${locale}/blog`,
          inLanguage: locale,
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          blogPost: all.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE.url}/${locale}/blog/${p.slug}`, datePublished: p.published, dateModified: p.updated ?? p.published, inLanguage: locale })),
        }}
      />
    </div>
  );
}
