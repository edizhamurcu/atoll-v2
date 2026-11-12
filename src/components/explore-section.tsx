import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PHOTOS, photoAlt, type PhotoKey } from "@/content/photos";
import { fmtDate, posts } from "@/content/blog";

const GUIDES: { key: "north" | "south" | "driving"; href: string; photo: PhotoKey }[] = [
  { key: "north", href: "/north-cyprus-guide", photo: "kyrenia-harbour" },
  { key: "south", href: "/south-cyprus-guide", photo: "aphrodite-rock-dusk" },
  { key: "driving", href: "/driving-in-south-cyprus", photo: "cyprus-road-sign" },
];

/** The three travel guides as photo cards (blog hub and home page). */
export async function GuideCards({ locale, priority = false, heading = "h2" }: { locale: string; priority?: boolean; heading?: "h2" | "h3" }) {
  const tv = await getTranslations({ locale, namespace: "travel" });
  const H = heading;
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {GUIDES.map((g, i) => (
        <li key={g.key}>
          <Link href={g.href} className="group relative isolate flex min-h-[15rem] flex-col md:min-h-[22rem] justify-end overflow-hidden rounded-panel bg-ink p-6 text-white">
            <Image src={PHOTOS[g.photo].src} alt={photoAlt(g.photo, locale)} fill priority={priority && i === 0} sizes="(min-width: 768px) 360px, 100vw" className="car-zoom -z-10 object-cover opacity-80" />
            <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/55 to-ink/5" />
            <H className="text-2xl font-extrabold leading-tight">{tv(g.key)}</H>
            <p className="mt-2 text-white/85">{tv(`${g.key}Desc`)}</p>
            <span className="btn-arrow mt-4 inline-flex items-center gap-1.5 font-semibold text-white underline underline-offset-4">{tv("read")}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Home page strip: "Explore Cyprus" — guide cards plus the three latest blog posts. */
export async function ExploreSection({ locale }: { locale: string }) {
  const tv = await getTranslations({ locale, namespace: "travel" });
  const latest = posts(locale).slice(0, 3);
  return (
    <section data-reveal className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="explore">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 id="explore" className="text-3xl font-extrabold md:text-4xl">{tv("exploreTitle")}</h2>
          <p className="mt-3 text-lg text-ink-soft">{tv("exploreLead")}</p>
        </div>
        <Link href="/blog" className="font-semibold text-aegean underline underline-offset-4 hover:text-ink">{tv("allTravel")}</Link>
      </div>
      <div className="mt-8"><GuideCards locale={locale} heading="h3" /></div>
      <h3 className="mt-14 text-xl font-bold">{tv("latestPosts")}</h3>
      <ul className="mt-5 grid gap-6 md:grid-cols-3">
        {latest.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="group grid grid-cols-[7rem_1fr] items-start gap-4 md:block">
              <span className="car-zoom block overflow-hidden rounded-panel">
                <Image src={PHOTOS[p.cover].src} alt={photoAlt(p.cover, locale)} width={PHOTOS[p.cover].w} height={PHOTOS[p.cover].h} sizes="(min-width: 768px) 360px, 112px" className="aspect-[4/3] w-full bg-stone-deep object-cover md:aspect-[3/2]" />
              </span>
              <span className="block md:mt-3">
                <time dateTime={p.published} className="text-sm text-ink-soft">{fmtDate(p.published, locale)}</time>
                <span className="mt-1 block text-lg font-bold leading-snug group-hover:text-aegean">{p.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
