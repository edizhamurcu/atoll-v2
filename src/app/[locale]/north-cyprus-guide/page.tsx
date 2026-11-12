import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { JsonLd } from "@/components/json-ld";
import { TravelNav } from "@/components/travel-nav";
import { CyprusMap, type MapPoint } from "@/components/cyprus-map";
import { PhotoCredit, PhotoFigure } from "@/components/photo-figure";
import { PHOTOS, LICENSE_URL, photo, photoAlt, type PhotoKey } from "@/content/photos";
import { posts } from "@/content/blog";
import { guide } from "@/content/guide";
import { SITE } from "@/lib/site";
import { money } from "@/lib/search-params";
import { trAblative } from "@/lib/tr-suffix";

const PATH = "/north-cyprus-guide";
const UPDATED = "2026-11-08";

/** Photos and links that go with the per-language content arrays (same order). */
const REGION_PHOTOS: PhotoKey[] = ["kyrenia-castle", "selimiye", "famagusta-mosque", "golden-beach", "soli"];
const REGION_POSTS: (string | null)[] = ["kyrenia-day-itinerary", null, "famagusta-salamis-varosha-day-trip", "karpaz-peninsula-road-trip", null];
const SIGHT_PHOTOS: PhotoKey[] = ["st-hilarion", "bellapais", "kyrenia-castle", "buyuk-han", "golden-beach", "salamis", "varosha", "kantara", "karpaz-donkeys", "apostolos-andreas", "soli", "alagadi"];
const HOTELS = ["Kaya Artemis Resort Hotel", "The Dome Hotel", "Acapulco Hotels & Resort", "Merit Royal Hotels", "Concorde Hotels"];
const LANGS = ["en", "tr", "de", "ru"] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/north-cyprus-guide">): Promise<Metadata> {
  const { locale } = await params;
  const g = guide(locale);
  const hero = photo("kyrenia-harbour");
  const url = `/${locale}${PATH}`;
  return {
    title: g.meta.title,
    description: g.meta.description,
    alternates: { canonical: url, languages: { ...Object.fromEntries(LANGS.map((l) => [l, `/${l}${PATH}`])), "x-default": `/en${PATH}` } },
    openGraph: { title: g.meta.title, description: g.meta.description, url, type: "article", images: [{ url: hero.src, width: hero.w, height: hero.h, alt: photoAlt("kyrenia-harbour", locale) }] },
    twitter: { card: "summary_large_image", images: [hero.src] },
  };
}

export default async function GuidePage({ params }: PageProps<"/[locale]/north-cyprus-guide">) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const g = guide(locale);
  const hero = photo("kyrenia-harbour");
  const latest = posts(locale).slice(0, 3);
  const used = [...new Set<PhotoKey>(["kyrenia-harbour", ...REGION_PHOTOS, ...SIGHT_PHOTOS, "halloumi"])];
  const L = g.regions.mapLabels;
  // x = (lon - 32.2) * 240, y = (35.78 - lat) * 240 — same projection as the map component.
  const map: MapPoint[] = [
    { slug: "kyrenia", label: L.kyrenia, x: 268, y: 106, primary: true },
    { slug: "nicosia", label: L.nicosia, x: 278, y: 144, labelAt: "below" },
    { slug: "famagusta", label: L.famagusta, x: 418, y: 158, labelAt: "below" },
    { slug: "guzelyurt", label: L.guzelyurt, x: 190, y: 139, labelAt: "below" },
    { slug: "kantara", label: L.kantara, x: 413, y: 92, labelAt: "above" },
    { slug: "golden-beach", label: L.goldenBeach, x: 556, y: 30, labelAt: "left" },
    { slug: "ercan", label: L.ercan, x: 312, y: 151, labelAt: "above" },
  ];
  const link = "text-aegean underline underline-offset-2";
  const more = "mt-5 inline-block font-semibold text-aegean underline underline-offset-4 hover:text-ink";
  const pageUrl = `${SITE.url}/${locale}${PATH}`;

  return (
    <article lang={locale}>
      <header className="relative isolate overflow-hidden bg-ink text-white">
        <Image src={hero.src} alt={photoAlt("kyrenia-harbour", locale)} fill priority sizes="100vw" className="-z-10 object-cover opacity-70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-10 md:pb-20 md:pt-16">
          <nav aria-label="Breadcrumb" className="text-sm text-white/80">
            <Link href="/" className="hover:text-white">Atoll Rent A Car</Link> <span aria-hidden>›</span> <span aria-current="page">{g.breadcrumb}</span>
          </nav>
          <h1 className="mt-24 max-w-3xl text-display font-extrabold md:mt-40">{g.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">{g.hero.lead}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/#search" className="btn-primary">{g.hero.findCar}</Link>
            <Link href="/blog" className="inline-flex items-center rounded-full border border-white/40 px-5 py-2.5 font-medium text-white hover:border-white">{g.hero.readBlog}</Link>
          </div>
          <p className="mt-10 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
            <span>{g.hero.updated} <time dateTime={UPDATED}>{g.hero.updatedDate}</time></span>
            <span className="[&_a]:text-white/80"><PhotoCredit k="kyrenia-harbour" /></span>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5">
        <TravelNav active="north" className="pt-6" />
        <section aria-labelledby="facts" className="py-12">
          <h2 id="facts" className="text-3xl font-extrabold">{g.facts.title}</h2>
          <dl className="mt-6 grid gap-px overflow-hidden rounded-panel bg-stone-deep sm:grid-cols-2 lg:grid-cols-4">
            {g.facts.items.map(([k, v]) => (
              <div key={k} className="bg-paper p-5">
                <dt className="text-sm font-semibold text-aegean">{k}</dt>
                <dd className="mt-1 text-[0.97rem] leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="regions" className="py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <h2 id="regions" className="text-3xl font-extrabold">{g.regions.title}</h2>
              <p className="mt-3 max-w-xl text-lg text-ink-soft">{g.regions.lead}</p>
            </div>
            <div className="rounded-panel bg-paper p-4">
              <CyprusMap points={map} title={g.regions.mapTitle} />
            </div>
          </div>
          <div className="mt-10 space-y-14">
            {g.regions.items.map((r, i) => (
              <section key={r.name} aria-labelledby={`r-${i}`} className="grid gap-6 md:grid-cols-2 md:items-center">
                <PhotoFigure k={REGION_PHOTOS[i]} sizes="(min-width: 768px) 560px, 100vw" className={i % 2 ? "md:order-2" : ""} imgClassName="aspect-[4/3] rounded-panel object-cover" />
                <div>
                  <h3 id={`r-${i}`} className="text-2xl font-extrabold">
                    {r.name} <span className="font-medium text-ink-soft">({r.local})</span>
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-aegean">{r.drive}</p>
                  <p className="mt-3 text-[1.05rem] leading-relaxed">{r.text}</p>
                  <ul className="mt-4 grid gap-1.5 text-ink-soft sm:grid-cols-2">
                    {r.see.map((s) => (
                      <li key={s} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-bougain" />{s}</li>
                    ))}
                  </ul>
                  {REGION_POSTS[i] && r.cta && <Link href={`/blog/${REGION_POSTS[i]}`} className={more}>{r.cta}</Link>}
                </div>
              </section>
            ))}
          </div>
          <p className="mt-12 text-ink-soft">
            {g.regions.more.before} <Link href="/about-north-cyprus" className={link}>{g.regions.more.link}</Link>{g.regions.more.after}
          </p>
        </section>

        <section aria-labelledby="sights" className="py-10">
          <h2 id="sights" className="text-3xl font-extrabold">{g.sights.title}</h2>
          <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {g.sights.items.map((s, i) => {
              const k = SIGHT_PHOTOS[i];
              return (
                <li key={s.name}>
                  <Image src={PHOTOS[k].src} alt={photoAlt(k, locale)} width={PHOTOS[k].w} height={PHOTOS[k].h} sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw" className="aspect-[3/2] w-full rounded-panel bg-stone-deep object-cover" />
                  <h3 className="mt-3 text-lg font-bold">{s.name}</h3>
                  <p className="text-sm font-medium text-aegean">{s.where}</p>
                  <p className="mt-1 text-ink-soft">{s.text}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="beaches" className="grid gap-8 py-10 md:grid-cols-2 md:items-center">
          <PhotoFigure k="golden-beach" caption={g.beaches.caption} sizes="(min-width: 768px) 560px, 100vw" />
          <div>
            <h2 id="beaches" className="text-3xl font-extrabold">{g.beaches.title}</h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed">{g.beaches.text}</p>
            <Link href="/blog/best-beaches-north-cyprus" className={more}>{g.beaches.link}</Link>
          </div>
        </section>

        <section aria-labelledby="when" className="py-10">
          <h2 id="when" className="text-3xl font-extrabold">{g.when.title}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {g.when.seasons.map((s) => (
              <div key={s.name} className="rounded-panel bg-paper p-5">
                <h3 className="text-xl font-bold">{s.name}</h3>
                <p className="text-sm font-medium text-aegean">{s.months}</p>
                <p className="mt-2 text-ink-soft">{s.text}</p>
              </div>
            ))}
          </div>
          <h3 className="mt-10 text-xl font-bold">{g.when.festivalsTitle}</h3>
          <dl className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
            {g.when.festivals.map(([when, what]) => (
              <div key={what} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr]">
                <dt className="font-semibold">{when}</dt>
                <dd className="text-ink-soft">{what}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-ink-soft">{g.when.note} <Link href="/blog/best-time-to-visit-north-cyprus" className={link}>{g.when.link}</Link></p>
        </section>

        <section aria-labelledby="getting" className="grid gap-10 py-10 lg:grid-cols-2">
          <div>
            <h2 id="getting" className="text-3xl font-extrabold">{g.getting.title}</h2>
            <h3 className="mt-6 text-lg font-bold">{g.getting.ercanTitle}</h3>
            <p className="mt-1 leading-relaxed">{g.getting.ercanText}</p>
            <h3 className="mt-6 text-lg font-bold">{g.getting.viaTitle}</h3>
            <p className="mt-1 leading-relaxed">
              {g.getting.viaText.before} <Link href="/larnaca-airport-transfer-to-girne-kyrenia-north-cyprus" className={link}>{g.getting.viaText.link}</Link>{g.getting.viaText.after}
            </p>
            <Link href="/blog/flying-to-north-cyprus-ercan-or-larnaca" className={more}>{g.getting.compare}</Link>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold">{g.around.title}</h2>
            <ul className="mt-6 space-y-3 leading-relaxed">
              {g.around.items.map((it) => (
                <li key={it.strong}>
                  <strong>{it.strong}</strong> {it.text}
                  {it.link && <> <Link href="/driving-in-south-cyprus" className={link}>{it.link}</Link></>}
                </li>
              ))}
            </ul>
            <Link href="/blog/driving-in-north-cyprus-tips" className={more}>{g.around.tips}</Link>
          </div>
        </section>

        <section aria-labelledby="food" className="grid gap-8 py-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 id="food" className="text-3xl font-extrabold">{g.food.title}</h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed">{g.food.text}</p>
            <Link href="/blog/what-to-eat-in-north-cyprus" className={more}>{g.food.link}</Link>
          </div>
          <PhotoFigure k="halloumi" sizes="(min-width: 768px) 560px, 100vw" />
        </section>

        <section aria-labelledby="hotels" className="py-10">
          <h2 id="hotels" className="text-3xl font-extrabold">{g.hotels.title}</h2>
          <p className="mt-3 text-ink-soft">{g.hotels.text}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {HOTELS.map((h) => (
              <li key={h} className="rounded-full border border-ink/15 bg-paper px-4 py-2 font-medium">{h}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-soft"><Link href="/delivery-charges" className={link}>{g.hotels.delivery}</Link></p>
        </section>

        <section aria-labelledby="faq" className="py-10">
          <h2 id="faq" className="text-3xl font-extrabold">{g.faq.title}</h2>
          <div className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
            {g.faq.items.map((f) => (
              <details key={f.q} className="group py-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="text-2xl text-aegean transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-4 leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="blog" className="py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="blog" className="text-3xl font-extrabold">{g.blog.title}</h2>
            <Link href="/blog#posts" className="font-semibold text-aegean underline underline-offset-4">{g.blog.all}</Link>
          </div>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {latest.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <Image src={PHOTOS[p.cover].src} alt={photoAlt(p.cover, locale)} width={PHOTOS[p.cover].w} height={PHOTOS[p.cover].h} sizes="(min-width: 768px) 360px, 100vw" className="aspect-[3/2] w-full rounded-panel bg-stone-deep object-cover" />
                  <h3 className="mt-3 text-lg font-bold leading-snug group-hover:text-aegean">{p.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="my-10 rounded-panel bg-ink px-6 py-10 text-white md:px-12">
          <h2 className="max-w-2xl text-3xl font-extrabold">{g.cta.title}</h2>
          <p className="mt-3 max-w-2xl text-white/85">{g.cta.text.replace("{price}", money(SITE.terms.fromPrice, locale)).replace("{abl}", trAblative(SITE.terms.fromPrice))}</p>
          <Link href="/#search" className="btn-primary mt-6">{g.cta.button}</Link>
        </section>

        <section aria-labelledby="credits" className="pb-4 pt-6 text-sm text-ink-soft">
          <h2 id="credits" className="text-base font-semibold text-ink">{g.credits.title}</h2>
          <ul className="mt-2 space-y-1">
            {used.map((k) => (
              <li key={k}>
                {photoAlt(k, locale)}: <a href={PHOTOS[k].source} rel="noopener" className="underline underline-offset-2">{PHOTOS[k].author}</a>, <a href={LICENSE_URL[PHOTOS[k].license]} rel="noopener license" className="underline underline-offset-2">{PHOTOS[k].license}</a>, Wikimedia Commons
              </li>
            ))}
          </ul>
        </section>
      </div>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: ({ en: "North Cyprus", tr: "Kuzey Kıbrıs", de: "Nordzypern", ru: "Северный Кипр" } as Record<string, string>)[locale] ?? "North Cyprus",
            description: g.meta.description,
            inLanguage: locale,
            url: pageUrl,
            image: `${SITE.url}${hero.src}`,
            touristType: g.touristTypes,
            includesAttraction: g.sights.items.map((s) => ({ "@type": "TouristAttraction", name: s.name, description: s.text, address: { "@type": "PostalAddress", addressLocality: s.where, addressCountry: "CY" } })),
          },
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: g.meta.title,
            description: g.meta.description,
            inLanguage: locale,
            datePublished: UPDATED,
            dateModified: UPDATED,
            image: `${SITE.url}${hero.src}`,
            mainEntityOfPage: pageUrl,
            author: { "@type": "Organization", name: SITE.name, url: SITE.url },
            publisher: { "@type": "Organization", name: SITE.name, url: SITE.url, logo: { "@type": "ImageObject", url: `${SITE.url}/brand/atoll-logo.png` } },
          },
          { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Atoll Rent A Car", item: `${SITE.url}/${locale}` }, { "@type": "ListItem", position: 2, name: g.breadcrumb, item: pageUrl }] },
          { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: locale, mainEntity: g.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ]}
      />
    </article>
  );
}
