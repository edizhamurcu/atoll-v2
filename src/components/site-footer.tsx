import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE, telLink, waLink, PHONES } from "@/lib/site";
import { Year } from "./year";

/** Mirrors the WordPress footer: tagline widget, "Pages" and "Information" menus, copyright line. */
export async function SiteFooter() {
  const [t, n] = await Promise.all([getTranslations("footer"), getTranslations("nav")]);
  return (
    <footer className="mt-24 border-t border-ink/10 bg-paper text-ink-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-4">
            <Image src="/brand/atoll-logo.png" alt="Atoll Rent A Car" width={318} height={141} className="h-14 w-auto" />
            <span aria-hidden="true" className="h-10 w-px bg-ink/15" />
            <Image src="/brand/osk-auto.svg" alt="OSK Auto by Karaçay" width={353} height={206} unoptimized className="h-11 w-auto" />
          </div>
          <p className="mt-4 font-display text-lg font-bold text-ink">{t("title")}</p>
          <p className="text-bougain">{t("lead")}</p>
        </div>
        <nav aria-label={n("pages")}>
          <h2 className="mb-3 text-sm font-semibold text-ink">{n("pages")}</h2>
          <ul className="space-y-2">
            <li><Link href="/cars" className="hover:text-ink">{n("explore")}</Link></li>
            <li><Link href="/about-us" className="hover:text-ink">{n("aboutUs")}</Link></li>
            <li><Link href="/contact" className="hover:text-ink">{n("contactUs")}</Link></li>
            <li><Link href="/north-cyprus-guide" className="hover:text-ink">{n("guide")}</Link></li>
            <li><Link href="/blog" className="hover:text-ink">{n("blog")}</Link></li>
          </ul>
        </nav>
        <nav aria-label={n("information")}>
          <h2 className="mb-3 text-sm font-semibold text-ink">{n("information")}</h2>
          <ul className="space-y-2">
            <li><Link href="/rental-terms" className="hover:text-ink">{n("rentalTerms")}</Link></li>
            <li><Link href="/driving-in-south-cyprus" className="hover:text-ink">{n("drivingSouth")}</Link></li>
            <li><Link href="/rental-agreement" className="hover:text-ink">{n("agreement")}</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-ink">{n("privacy")}</Link></li>
          </ul>
        </nav>
        <address className="not-italic">
          <p>{t("address")}</p>
          <p className="mt-2 text-sm">{t("hours")}</p>
          <p className="mt-3 flex flex-col gap-1">
            {PHONES.map((n) => (
              <span key={n} className="flex flex-wrap items-baseline gap-x-2">
                <a href={telLink(n)} className="hover:text-ink">{n}</a>
                <a href={waLink(undefined, n)} className="text-sm underline-offset-2 hover:text-ink hover:underline" rel="noopener" aria-label={`WhatsApp ${n}`}>WhatsApp</a>
              </span>
            ))}
            <a href={`mailto:${SITE.email}`} className="hover:text-ink">{SITE.email}</a>
          </p>
        </address>
      </div>
      <p className="border-t border-ink/10 px-5 py-5 text-center text-xs text-ink-soft/80">
        Copyright © <Year />. Atoll. {t("developedBy")} <a href={SITE.developerUrl} rel="noopener" className="underline">Arekan Bilgi Teknolojileri Ltd.</a>
      </p>
    </footer>
  );
}
