import Image from "next/image";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE, SOCIAL, telLink, waLink, PHONES } from "@/lib/site";
import { Year } from "./year";

/**
 * Footer mirrors the header's structure: rental (Atoll, red) and sales (OSK Auto, gold)
 * as two separate groups, then Discover / Company, then contact details and social links.
 */
export async function SiteFooter() {
  const [t, n, m, s] = await Promise.all([getTranslations("footer"), getTranslations("nav"), getTranslations("menu"), getTranslations("sales")]);

  const rent: [string, string][] = [
    ["/cars", m("fleet")],
    ["/car-prices", n("carPrices")],
    ["/rental-terms", n("rentalTerms")],
    ["/special-offers", n("specialOffers")],
    ["/rental-agreement", n("agreement")],
  ];
  const sale: [string, string][] = [
    ["/car-sales#gallery", m("showroom")],
    ["/car-sales#stock", m("stock")],
    ["/car-sales#after", m("service")],
  ];
  const discover: [string, string][] = [
    ["/north-cyprus-guide", n("guide")],
    ["/south-cyprus-guide", n("southGuide")],
    ["/driving-in-south-cyprus", n("drivingSouth")],
    ["/blog", n("blog")],
  ];
  const company: [string, string][] = [
    ["/about-us", n("aboutUs")],
    ["/contact", n("contactUs")],
    ["/privacy-policy", n("privacy")],
  ];

  const list = (items: [string, string][]) => (
    <ul className="space-y-2.5">
      {items.map(([href, label]) => (
        <li key={href}><Link href={href} className="hyphens-auto break-words transition-colors hover:text-ink">{label}</Link></li>
      ))}
    </ul>
  );
  const heading = (label: string, dot?: string) => (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink">
      {dot && <span aria-hidden className={`size-2 rounded-full ${dot}`} />}
      {label}
    </h2>
  );

  return (
    <footer className="mt-24 border-t border-ink/10 bg-paper text-ink-soft">
      {/* Brand band: both logos, tagline, social */}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 pb-10 pt-12 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Atoll Rent A Car, home">
            <Image src="/brand/atoll-logo.png" alt="Atoll Rent A Car" width={318} height={141} className="h-14 w-auto" />
          </Link>
          <span aria-hidden="true" className="h-10 w-px bg-ink/15" />
          <Link href="/car-sales" aria-label="OSK Auto by Karaçay">
            <Image src="/brand/osk-auto.svg" alt="OSK Auto by Karaçay" width={353} height={206} unoptimized className="h-11 w-auto" />
          </Link>
          <div className="ml-2 hidden border-l border-ink/10 pl-5 lg:block">
            <p className="font-display text-lg font-bold leading-tight text-ink">{t("title")}</p>
            <p className="text-bougain">{t("lead")}</p>
          </div>
        </div>
        <div className="lg:hidden">
          <p className="font-display text-lg font-bold text-ink">{t("title")}</p>
          <p className="text-bougain">{t("lead")}</p>
        </div>
        {SOCIAL.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-ink">{t("follow")}</span>
            <ul className="flex gap-2">
              {SOCIAL.map((so) => (
                <li key={so.key}>
                  <a
                    href={so.url}
                    target="_blank"
                    rel="noopener"
                    aria-label={`${SOCIAL_NAME[so.key]} (Atoll Rent A Car)`}
                    className={`grid size-11 place-items-center rounded-full border border-ink/12 text-ink transition-all hover:-translate-y-0.5 hover:border-transparent hover:text-white motion-reduce:hover:translate-y-0 ${SOCIAL_HOVER[so.key]}`}
                  >
                    <SocialIcon name={so.key} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Link groups, same split as the header */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 border-t border-ink/10 px-5 py-12 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_1.3fr]">
        <nav aria-label={n("rentCars")} className="col-span-2 rounded-3xl sm:col-span-1 border-t-4 border-bougain bg-stone/60 p-5">
          {heading(n("rentCars"), "bg-bougain")}
          {list(rent)}
        </nav>
        <nav aria-label={n("carSales")} className="col-span-2 rounded-3xl sm:col-span-1 border-t-4 border-gold bg-stone/60 p-5">
          {heading(n("carSales"), "bg-gold")}
          {list(sale)}
          <a href={waLink(s("waText"))} target="_blank" rel="noopener" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-gold/80">
            {m("whatsapp")}
          </a>
        </nav>
        <div className="col-span-2 grid grid-cols-2 gap-6 sm:col-span-1 sm:block sm:space-y-8 md:pt-5">
          <nav aria-label={m("discover")}>
            {heading(m("discover"))}
            {list(discover)}
          </nav>
          <nav aria-label={t("company")}>
            {heading(t("company"))}
            {list(company)}
          </nav>
        </div>
        <address className="col-span-2 not-italic md:col-span-1 md:pt-5">
          {heading(n("contactUs"))}
          <p>{t("address")}</p>
          <p className="mt-2 text-sm">{t("hours")}</p>
          <ul className="mt-4 space-y-2">
            {PHONES.map((p) => (
              <li key={p} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <a href={telLink(p)} className="font-semibold text-ink hover:text-bougain">{p}</a>
                <a href={waLink(undefined, p)} rel="noopener" target="_blank" aria-label={`WhatsApp ${p}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#1f8f4e]/30 bg-[#e8f5ed] px-2.5 py-1 text-xs font-semibold text-[#14653a] hover:border-[#1f8f4e]/60"><WhatsAppIcon className="size-4" />WhatsApp</a>
              </li>
            ))}
            <li><a href={`mailto:${SITE.email}`} className="hover:text-ink">{SITE.email}</a></li>
          </ul>
        </address>
      </div>

      <p className="border-t border-ink/10 px-5 py-5 text-center text-xs text-ink-soft/80">
        Copyright © <Year />. Atoll. {t("developedBy")} <a href={SITE.developerUrl} rel="noopener" className="underline">Arekan Bilgi Teknolojileri Ltd.</a>
      </p>
    </footer>
  );
}

type Social = (typeof SOCIAL)[number]["key"];
const SOCIAL_NAME: Record<Social, string> = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube" };
const SOCIAL_HOVER: Record<Social, string> = {
  instagram: "hover:bg-[#d62976]",
  facebook: "hover:bg-[#1877f2]",
  youtube: "hover:bg-[#ff0000]",
};

function SocialIcon({ name }: { name: Social }) {
  if (name === "instagram")
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    );
  if (name === "facebook")
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21z" />
      </svg>
    );
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" />
    </svg>
  );
}
