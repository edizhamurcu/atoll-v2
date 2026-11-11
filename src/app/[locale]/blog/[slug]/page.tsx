import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { PhotoCredit, PhotoFigure } from "@/components/photo-figure";
import { PHOTOS, photo, photoAlt } from "@/content/photos";
import { BLOG_LOCALES, fmtDate, getPost, posts, readingMinutes, related, segments, toc } from "@/content/blog";
import { money } from "@/lib/search-params";
import { SITE } from "@/lib/site";
import { trAblative } from "@/lib/tr-suffix";

export function generateStaticParams() {
  return posts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = getPost(slug, locale);
  if (!p) return {};
  const cover = photo(p.cover);
  const url = `/${locale}/blog/${p.slug}`;
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: url, languages: { ...Object.fromEntries(BLOG_LOCALES.map((l) => [l, `/${l}/blog/${p.slug}`])), "x-default": `/en/blog/${p.slug}` } },
    openGraph: { title: p.title, description: p.description, url, type: "article", publishedTime: p.published, modifiedTime: p.updated ?? p.published, images: [{ url: cover.src, width: cover.w, height: cover.h, alt: photoAlt(p.cover, locale) }] },
    twitter: { card: "summary_large_image", images: [cover.src] },
  };
}

export default async function BlogPost({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, slug } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const p = getPost(slug, locale);
  if (!p) notFound();
  const [t, n] = await Promise.all([getTranslations({ locale, namespace: "blog" }), getTranslations({ locale, namespace: "nav" })]);
  const cover = photo(p.cover);
  const contents = toc(p);
  const more = related(p, locale);
  const url = `${SITE.url}/${locale}/blog/${p.slug}`;

  return (
    <article className="mx-auto max-w-6xl px-5 pt-8" lang={locale}>
      <Breadcrumbs locale={locale} items={[{ name: "Atoll Rent A Car", href: "/" }, { name: n("blog"), href: "/blog" }, { name: p.title, href: `/blog/${p.slug}` }]} />
      <header className="mx-auto mt-6 max-w-3xl">
        <p className="text-sm text-ink-soft">
          <time dateTime={p.published}>{fmtDate(p.published, locale)}</time>
          {p.updated && p.updated !== p.published && <> · {t("updated")} <time dateTime={p.updated}>{fmtDate(p.updated, locale)}</time></>} · {t("minRead", { n: readingMinutes(p) })}
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] md:text-5xl">{p.title}</h1>
        <p className="mt-4 text-xl text-ink-soft">{p.description}</p>
      </header>

      <figure className="mx-auto mt-8 max-w-5xl">
        <Image src={cover.src} alt={photoAlt(p.cover, locale)} width={cover.w} height={cover.h} priority sizes="(min-width: 1024px) 1024px, 100vw" className="aspect-[16/9] w-full rounded-panel bg-stone-deep object-cover" />
        <figcaption className="mt-2 text-ink-soft"><PhotoCredit k={p.cover} /></figcaption>
      </figure>

      <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[1fr_15rem]">
        <div className="min-w-0 max-w-3xl">
          {contents.length > 2 && (
            <nav aria-labelledby="toc" className="mb-8 rounded-panel bg-paper p-5 lg:hidden">
              <h2 id="toc" className="text-sm font-semibold text-ink">{t("inThisArticle")}</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-soft">
                {contents.map((c) => <li key={c.id}><a href={`#${c.id}`} className="hover:text-ink">{c.text}</a></li>)}
              </ol>
            </nav>
          )}
          <div className="prose-atoll [&_h2]:scroll-mt-28">
            {segments(p).map((s, i) =>
              s.type === "html" ? (
                <div key={i} dangerouslySetInnerHTML={{ __html: s.html }} />
              ) : (
                <PhotoFigure key={i} k={s.key} caption={s.caption} className="my-8 [&_img]:my-0" />
              ),
            )}
          </div>

          <aside className="mt-12 rounded-panel bg-ink p-6 text-white md:p-8">
            <h2 className="text-2xl font-extrabold">{t("ctaTitle")}</h2>
            <p className="mt-2 text-white/85">{t("ctaText", { price: money(SITE.terms.fromPrice, locale), abl: trAblative(SITE.terms.fromPrice) })}</p>
            <Link href="/#search" className="btn-primary mt-5">{t("ctaButton")}</Link>
          </aside>
        </div>

        {contents.length > 2 && (
          <nav aria-label={t("inThisArticle")} className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-sm font-semibold text-ink">{t("inThisArticle")}</p>
              <ol className="mt-3 space-y-2 border-l border-ink/10 text-sm text-ink-soft">
                {contents.map((c) => <li key={c.id}><a href={`#${c.id}`} className="-ml-px block border-l border-transparent pl-3 hover:border-aegean hover:text-ink">{c.text}</a></li>)}
              </ol>
            </div>
          </nav>
        )}
      </div>

      {more.length > 0 && (
        <section aria-labelledby="more" className="mx-auto mt-16 max-w-5xl">
          <h2 id="more" className="text-2xl font-extrabold">{t("keepReading")}</h2>
          <ul className="mt-5 grid gap-6 md:grid-cols-3">
            {more.map((q) => (
              <li key={q.slug}>
                <Link href={`/blog/${q.slug}`} className="group block">
                  <Image src={PHOTOS[q.cover].src} alt={photoAlt(q.cover, locale)} width={PHOTOS[q.cover].w} height={PHOTOS[q.cover].h} sizes="(min-width: 768px) 320px, 100vw" className="aspect-[3/2] w-full rounded-panel bg-stone-deep object-cover" />
                  <h3 className="mt-3 font-bold leading-snug group-hover:text-aegean">{q.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: p.title,
          description: p.description,
          inLanguage: locale,
          datePublished: p.published,
          dateModified: p.updated ?? p.published,
          image: [`${SITE.url}${cover.src}`],
          mainEntityOfPage: url,
          url,
          keywords: p.tags.join(", "),
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url, logo: { "@type": "ImageObject", url: `${SITE.url}/brand/atoll-logo.png` } },
          isPartOf: { "@type": "Blog", name: t("title"), url: `${SITE.url}/${locale}/blog` },
        }}
      />
    </article>
  );
}
