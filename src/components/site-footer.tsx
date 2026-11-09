import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE, telLink, waLink } from "@/lib/site";
import { Year } from "./year";

/** Mirrors the WordPress footer: tagline widget, "Pages" and "Information" menus, copyright line. */
export async function SiteFooter() {
  const [t, n] = await Promise.all([getTranslations("footer"), getTranslations("nav")]);
  return (
    <footer className="mt-24 border-t border-ink/10 bg-paper text-ink-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Image src="/brand/atoll-logo.png" alt="Atoll Rent A Car" width={318} height={141} className="h-14 w-auto" />
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
            <a href={telLink(SITE.phone)} className="hover:text-ink">{SITE.phone}</a>
            <a href={waLink()} className="hover:text-ink" rel="noopener">WhatsApp {SITE.whatsapp}</a>
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
