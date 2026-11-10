import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const IMG = "/media/osk";
const THUMBS = [
  { src: `${IMG}/showroom-bmw-x6.webp`, alt: "bmwX6" },
  { src: `${IMG}/showroom-bmw.webp`, alt: "bmw" },
  { src: `${IMG}/showroom-hall.webp`, alt: "hall" },
] as const;

/** Home page: OSK Auto (sister company in the same building) — sales, workshop, body shop, car wash. */
export async function OskSection() {
  const [h, s] = await Promise.all([getTranslations("home"), getTranslations("sales")]);
  const services = [
    ["oskSales", "oskSalesText"],
    ["oskWorkshop", "oskWorkshopText"],
    ["oskBody", "oskBodyText"],
    ["oskWash", "oskWashText"],
  ] as const;
  return (
    <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="osk">
      <div className="grid gap-10 border-t border-ink/10 pt-12 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        <div>
          <Link href="/car-sales" className="group relative block overflow-hidden rounded-2xl">
            <Image src={`${IMG}/showroom-mercedes.webp`} alt={s("imgAlt.mercedes")} width={1440} height={1080} sizes="(min-width: 1024px) 560px, 100vw" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          </Link>
          <p className="mt-5 text-sm font-semibold text-ink-soft">{h("oskShowroom")}</p>
          <ul className="mt-2 grid grid-cols-3 gap-3">
            {THUMBS.map((t) => (
              <li key={t.src}>
                <Link href="/car-sales" className="block overflow-hidden rounded-xl">
                  <Image src={t.src} alt={s(`imgAlt.${t.alt}`)} width={1440} height={1080} sizes="(min-width: 1024px) 180px, 33vw" className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.04]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Image src="/brand/osk-auto.svg" alt={h("oskEyebrow")} width={353} height={206} unoptimized className="h-14 w-auto" />
          <h2 id="osk" className="mt-5 text-3xl font-extrabold md:text-4xl">{h("oskTitle")}</h2>
          <p className="mt-3 text-lg text-ink-soft">{h("oskLead")}</p>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {services.map(([title, text]) => (
              <div key={title} className="border-l-2 border-gold/70 pl-4">
                <dt className="font-bold">{h(title)}</dt>
                <dd className="mt-1 text-ink-soft">{h(text)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/car-sales" className="btn-primary">{h("oskCta")}</Link>
            <Link href="/about-us" className="btn-quiet">{h("oskAbout")}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
