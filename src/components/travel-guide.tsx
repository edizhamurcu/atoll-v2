import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { PhotoCredit, PhotoFigure } from "@/components/photo-figure";
import { TravelNav, type TravelSectionKey } from "@/components/travel-nav";
import { PHOTOS, LICENSE_URL, photo, photoAlt } from "@/content/photos";
import { posts } from "@/content/blog";
import { pagePhotos, type TravelPage, type TravelSection } from "@/content/travel/types";
import { SITE } from "@/lib/site";
import { money } from "@/lib/search-params";
import { trAblative } from "@/lib/tr-suffix";

const link = "text-aegean underline underline-offset-2";
const more = "mt-5 inline-block font-semibold text-aegean underline underline-offset-4 hover:text-ink";
const h2 = "text-3xl font-extrabold";

/** Same layout and typography as the North Cyprus guide, driven by a TravelPage content object. */
export function TravelGuideView({ page: g, locale, path, updated, nav }: { page: TravelPage; locale: string; path: string; updated: string; nav: TravelSectionKey }) {
  const hero = photo(g.heroPhoto);
  const latest = posts(locale).slice(0, 3);
  const pageUrl = `${SITE.url}/${locale}${path}`;
  const price = (s: string) => s.replace("{price}", money(SITE.terms.fromPrice, locale)).replace("{abl}", trAblative(SITE.terms.fromPrice));

  return (
    <article lang={locale}>
      <header className="relative isolate overflow-hidden bg-ink text-white">
        <Image src={hero.src} alt={photoAlt(g.heroPhoto, locale)} fill priority sizes="100vw" className="-z-10 object-cover opacity-70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-10 md:pb-20 md:pt-16">
          <nav aria-label="Breadcrumb" className="text-sm text-white/80">
            <Link href="/" className="hover:text-white">Atoll Rent A Car</Link> <span aria-hidden>›</span> <Link href="/blog" className="hover:text-white">Blog</Link> <span aria-hidden>›</span> <span aria-current="page">{g.breadcrumb}</span>
          </nav>
          <h1 className="mt-24 max-w-3xl text-display font-extrabold md:mt-40">{g.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">{g.hero.lead}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={g.hero.primary.href} className="btn-primary">{g.hero.primary.label}</Link>
            <Link href={g.hero.secondary.href} className="inline-flex items-center rounded-full border border-white/40 px-5 py-2.5 font-medium text-white hover:border-white">{g.hero.secondary.label}</Link>
          </div>
          <p className="mt-10 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
            <span>{g.hero.updated} <time dateTime={updated}>{g.hero.updatedDate}</time></span>
            <span className="[&_a]:text-white/80"><PhotoCredit k={g.heroPhoto} /></span>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5">
        <TravelNav active={nav} className="pt-6" />

        <section aria-labelledby="facts" className="py-12">
          <h2 id="facts" className={h2}>{g.facts.title}</h2>
          <dl className="mt-6 grid gap-px overflow-hidden rounded-panel bg-stone-deep sm:grid-cols-2 lg:grid-cols-4">
            {g.facts.items.map(([k, v]) => (
              <div key={k} className="bg-paper p-5">
                <dt className="text-sm font-semibold text-aegean">{k}</dt>
                <dd className="mt-1 text-[0.97rem] leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {g.sections.map((s) => <Section key={s.id} s={s} locale={locale} />)}

        <section aria-labelledby="faq" className="py-10">
          <h2 id="faq" className={h2}>{g.faq.title}</h2>
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
            <h2 id="blog" className={h2}>{g.blog.title}</h2>
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
          <p className="mt-3 max-w-2xl text-white/85">{price(g.cta.text)}</p>
          <Link href="/#search" className="btn-primary mt-6">{g.cta.button}</Link>
        </section>

        <section aria-labelledby="credits" className="pb-4 pt-6 text-sm text-ink-soft">
          <h2 id="credits" className="text-base font-semibold text-ink">{g.credits.title}</h2>
          <ul className="mt-2 space-y-1">
            {pagePhotos(g).map((k) => (
              <li key={k}>
                {photoAlt(k, locale)}: <a href={PHOTOS[k].source} rel="noopener" className="underline underline-offset-2">{PHOTOS[k].author}</a>, <a href={LICENSE_URL[PHOTOS[k].license]} rel="noopener license" className="underline underline-offset-2">{PHOTOS[k].license}</a>, Wikimedia Commons
              </li>
            ))}
          </ul>
        </section>
      </div>

      <JsonLd
        data={[
          ...(g.destination
            ? [{
                "@context": "https://schema.org",
                "@type": "TouristDestination",
                name: g.destination,
                description: g.meta.description,
                inLanguage: locale,
                url: pageUrl,
                image: `${SITE.url}${hero.src}`,
                touristType: g.touristTypes,
                includesAttraction: g.sections.flatMap((s) => (s.kind === "cards" ? s.items.map((i) => ({ "@type": "TouristAttraction", name: i.name, description: i.text, address: { "@type": "PostalAddress", addressLocality: i.where, addressCountry: "CY" } })) : [])),
              }]
            : []),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: g.meta.title,
            description: g.meta.description,
            inLanguage: locale,
            datePublished: updated,
            dateModified: updated,
            image: `${SITE.url}${hero.src}`,
            mainEntityOfPage: pageUrl,
            author: { "@type": "Organization", name: SITE.name, url: SITE.url },
            publisher: { "@type": "Organization", name: SITE.name, url: SITE.url, logo: { "@type": "ImageObject", url: `${SITE.url}/brand/atoll-logo.png` } },
          },
          { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Atoll Rent A Car", item: `${SITE.url}/${locale}` }, { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/${locale}/blog` }, { "@type": "ListItem", position: 3, name: g.breadcrumb, item: pageUrl }] },
          { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: locale, mainEntity: g.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ]}
      />
    </article>
  );
}

function Section({ s, locale }: { s: TravelSection; locale: string }) {
  const lead = (t?: string) => t && <p className="mt-3 max-w-3xl text-lg text-ink-soft">{t}</p>;
  switch (s.kind) {
    case "regions":
      return (
        <section aria-labelledby={s.id} className="py-10">
          <h2 id={s.id} className={h2}>{s.title}</h2>
          {lead(s.lead)}
          <div className="mt-10 space-y-14">
            {s.items.map((r, i) => (
              <section key={r.name} aria-labelledby={`${s.id}-${i}`} className="grid gap-6 md:grid-cols-2 md:items-center">
                <PhotoFigure k={r.photo} sizes="(min-width: 768px) 560px, 100vw" className={i % 2 ? "md:order-2" : ""} imgClassName="aspect-[4/3] rounded-panel object-cover" />
                <div>
                  <h3 id={`${s.id}-${i}`} className="text-2xl font-extrabold">
                    {r.name} {r.local && <span className="font-medium text-ink-soft">({r.local})</span>}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-aegean">{r.tag}</p>
                  <p className="mt-3 text-[1.05rem] leading-relaxed">{r.text}</p>
                  <ul className="mt-4 grid gap-1.5 text-ink-soft sm:grid-cols-2">
                    {r.see.map((x) => (
                      <li key={x} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-bougain" />{x}</li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        </section>
      );
    case "cards":
      return (
        <section aria-labelledby={s.id} className="py-10">
          <h2 id={s.id} className={h2}>{s.title}</h2>
          {lead(s.lead)}
          <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {s.items.map((c) => (
              <li key={c.name}>
                <Image src={PHOTOS[c.photo].src} alt={photoAlt(c.photo, locale)} width={PHOTOS[c.photo].w} height={PHOTOS[c.photo].h} sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw" className="aspect-[3/2] w-full rounded-panel bg-stone-deep object-cover" />
                <h3 className="mt-3 text-lg font-bold">{c.name}</h3>
                <p className="text-sm font-medium text-aegean">{c.where}</p>
                <p className="mt-1 text-ink-soft">{c.text}</p>
              </li>
            ))}
          </ul>
        </section>
      );
    case "split":
      return (
        <section aria-labelledby={s.id} className="grid gap-8 py-10 md:grid-cols-2 md:items-center">
          <PhotoFigure k={s.photo} caption={s.caption} sizes="(min-width: 768px) 560px, 100vw" className={s.reverse ? "md:order-2" : ""} />
          <div>
            <h2 id={s.id} className={h2}>{s.title}</h2>
            {s.paragraphs.map((p) => <p key={p} className="mt-3 text-[1.05rem] leading-relaxed">{p}</p>)}
            {s.link && <Link href={s.link.href} className={more}>{s.link.label}</Link>}
          </div>
        </section>
      );
    case "seasons":
      return (
        <section aria-labelledby={s.id} className="py-10">
          <h2 id={s.id} className={h2}>{s.title}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.items.map((x) => (
              <div key={x.name} className="rounded-panel bg-paper p-5">
                <h3 className="text-xl font-bold">{x.name}</h3>
                <p className="text-sm font-medium text-aegean">{x.months}</p>
                <p className="mt-2 text-ink-soft">{x.text}</p>
              </div>
            ))}
          </div>
          {s.note && <p className="mt-4 text-sm text-ink-soft">{s.note}</p>}
        </section>
      );
    case "steps":
      return (
        <section aria-labelledby={s.id} className="py-10">
          <h2 id={s.id} className={h2}>{s.title}</h2>
          {lead(s.lead)}
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {s.items.map((x, i) => (
              <li key={x.title} className="flex gap-4 rounded-panel bg-paper p-5">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lg font-extrabold text-white">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-bold leading-snug">{x.title}</h3>
                  <p className="mt-1 text-ink-soft">{x.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      );
    case "rules": {
      const list = (
        <div>
          <h2 id={s.id} className={h2}>{s.title}</h2>
          {lead(s.lead)}
          <ul className="mt-6 space-y-3 leading-relaxed">
            {s.items.map((x) => (
              <li key={x.strong} className="flex gap-3"><span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-bougain" /><span><strong>{x.strong}</strong> {x.text}</span></li>
            ))}
          </ul>
          {s.link && <Link href={s.link.href} className={more}>{s.link.label}</Link>}
        </div>
      );
      return (
        <section aria-labelledby={s.id} className={s.photo ? "grid gap-8 py-10 md:grid-cols-2 md:items-start" : "py-10"}>
          {list}
          {s.photo && <PhotoFigure k={s.photo} sizes="(min-width: 768px) 560px, 100vw" />}
        </section>
      );
    }
    case "callout":
      return (
        <section aria-labelledby={s.id} className="py-6">
          <div className={`rounded-panel border p-6 md:p-8 ${s.tone === "warn" ? "border-alert/30 bg-alert/[0.06]" : "border-aegean/30 bg-aegean-wash/60"}`}>
            <h2 id={s.id} className={`text-xl font-extrabold ${s.tone === "warn" ? "text-alert" : "text-ink"}`}>{s.title}</h2>
            <p className="mt-2 max-w-4xl leading-relaxed">{s.text}</p>
            {s.link && <Link href={s.link.href} className={link + " mt-3 inline-block font-semibold"}>{s.link.label}</Link>}
          </div>
        </section>
      );
  }
}
