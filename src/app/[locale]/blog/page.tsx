import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { PHOTOS } from "@/content/photos";
import { fmtDate, posts, readingMinutes } from "@/content/blog";
import { SITE } from "@/lib/site";

const TITLE = "North Cyprus Travel Blog";
const DESCRIPTION = "Travel tips, road trips, beaches, food and practical advice for visiting North Cyprus, from the local team at Atoll Rent A Car in Kyrenia.";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/en/blog", languages: { en: "/en/blog", "x-default": "/en/blog" }, types: { "application/rss+xml": "/blog/feed.xml" } },
    robots: locale === "en" ? undefined : { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, url: "/en/blog", type: "website" },
  };
}

export default async function BlogIndex({ params }: PageProps<"/[locale]/blog">) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const [first, ...rest] = posts();
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8" lang="en">
      <Breadcrumbs items={[{ name: "Atoll Rent A Car", href: "/" }, { name: "Blog", href: "/blog" }]} />
      <header className="mt-4 max-w-3xl">
        <h1 className="text-display font-extrabold">{TITLE}</h1>
        <p className="mt-4 text-lg text-ink-soft">{DESCRIPTION} New to the island? Start with our <Link href="/north-cyprus-guide" className="text-aegean underline underline-offset-2">North Cyprus guide</Link>.</p>
      </header>

      {first && (
        <Link href={`/blog/${first.slug}`} className="group mt-10 grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-center">
          <Image src={PHOTOS[first.cover].src} alt={PHOTOS[first.cover].alt} width={PHOTOS[first.cover].w} height={PHOTOS[first.cover].h} priority sizes="(min-width: 768px) 640px, 100vw" className="aspect-[3/2] w-full rounded-panel bg-stone-deep object-cover" />
          <div>
            <PostMeta iso={first.published} minutes={readingMinutes(first)} />
            <h2 className="mt-2 text-3xl font-extrabold leading-tight group-hover:text-aegean md:text-4xl">{first.title}</h2>
            <p className="mt-3 text-lg text-ink-soft">{first.description}</p>
          </div>
        </Link>
      )}

      <ul className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="group block">
              <Image src={PHOTOS[p.cover].src} alt={PHOTOS[p.cover].alt} width={PHOTOS[p.cover].w} height={PHOTOS[p.cover].h} sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw" className="aspect-[3/2] w-full rounded-panel bg-stone-deep object-cover" />
              <PostMeta iso={p.published} minutes={readingMinutes(p)} className="mt-4" />
              <h2 className="mt-1 text-xl font-bold leading-snug group-hover:text-aegean">{p.title}</h2>
              <p className="mt-2 text-ink-soft">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE.url}/en/blog`,
          inLanguage: "en",
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          blogPost: posts().map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE.url}/en/blog/${p.slug}`, datePublished: p.published, dateModified: p.updated ?? p.published })),
        }}
      />
    </div>
  );
}

function PostMeta({ iso, minutes, className = "" }: { iso: string; minutes: number; className?: string }) {
  return (
    <p className={`text-sm text-ink-soft ${className}`}>
      <time dateTime={iso}>{fmtDate(iso)}</time> <span aria-hidden>·</span> {minutes} min read
    </p>
  );
}
