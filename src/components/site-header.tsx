import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { Suspense } from "react";
import { CarSegments, CarSegmentsView } from "./car-segments";

/** Menu mirrors the WordPress primary menu (Home, Explore Vehicles, Pages ▾, Contact Us), plus the new Blog. */
export async function SiteHeader() {
  const t = await getTranslations("nav");
  const pages = [
    ["/car-prices", t("carPrices")],
    ["/about-us", t("aboutUs")],
    ["/rental-terms", t("rentalTerms")],
    ["/special-offers", t("specialOffers")],
    ["/north-cyprus-guide", t("guide")],
  ] as const;
  const item = "rounded-lg px-3 py-2 hover:bg-ink/5 hover:text-ink";
  return (
    <header className="sticky top-0 z-30 border-b border-ink/8 bg-stone/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.75rem] max-w-6xl items-center gap-4 px-5">
        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          <Link href="/" className="shrink-0" aria-label="Atoll Rent A Car, home">
            <Image src="/brand/atoll-logo.png" alt="Atoll Rent A Car" width={318} height={141} priority className="h-12 w-auto md:h-[3.25rem]" />
          </Link>
          {/* Sister company in the same building (see About us) */}
          <span aria-hidden="true" className="h-9 w-px bg-ink/15" />
          <Link href="/about-us" className="shrink-0 opacity-90 transition-opacity hover:opacity-100" aria-label="OSK Auto by Karaçay">
            <Image src="/brand/osk-auto.svg" alt="OSK Auto by Karaçay" width={353} height={206} unoptimized priority className="h-9 w-auto md:h-10" />
          </Link>
        </div>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 text-[0.95rem] text-ink-soft lg:flex">
          <Link href="/" className={`${item} hidden xl:block`}>{t("home")}</Link>
          <div className="mx-2"><Suspense fallback={<CarSegmentsView rentLabel={t("rentCars")} saleLabel={t("carSales")} />}><CarSegments rentLabel={t("rentCars")} saleLabel={t("carSales")} /></Suspense></div>
          <details className="group relative">
            <summary className={`${item} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}>
              {t("pages")}
              <svg aria-hidden viewBox="0 0 12 12" className="size-3 transition-transform group-open:rotate-180"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            </summary>
            <ul className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-paper p-2 shadow-[0_18px_40px_-18px_rgba(13,52,64,.4)]">
              {pages.map(([href, label]) => (
                <li key={href}><Link href={href} className="block rounded-lg px-3 py-2 hover:bg-stone hover:text-ink">{label}</Link></li>
              ))}
            </ul>
          </details>
          <Link href="/blog" className={item}>{t("blog")}</Link>
          <Link href="/contact" className={item}>{t("contactUs")}</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <LocaleSwitcher label={t("language")} />
          <Link href="/#search" className="btn-primary hidden !px-5 !py-2 text-sm sm:inline-flex">{t("book")}</Link>
          <details className="group lg:hidden">
            <summary aria-label={t("menu")} className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-ink/15 [&::-webkit-details-marker]:hidden">
              <svg aria-hidden viewBox="0 0 24 24" className="size-5 group-open:hidden"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              <svg aria-hidden viewBox="0 0 24 24" className="hidden size-5 group-open:block"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </summary>
            <nav aria-label={t("menu")} className="absolute inset-x-0 top-[4.75rem] max-h-[calc(100dvh-4.75rem)] overflow-y-auto border-b border-ink/10 bg-paper px-5 pb-6 pt-2 shadow-lg">
              <Suspense fallback={<CarSegmentsView variant="cards" rentLabel={t("rentCars")} saleLabel={t("carSales")} />}><CarSegments variant="cards" rentLabel={t("rentCars")} saleLabel={t("carSales")} /></Suspense>
              <ul className="divide-y divide-ink/8 text-lg">
                {[["/", t("home")], ...pages, ["/blog", t("blog")], ["/contact", t("contactUs")]].map(([href, label]) => (
                  <li key={href}><Link href={href} className="block py-3.5">{label}</Link></li>
                ))}
              </ul>
              <Link href="/#search" className="btn-primary mt-5 w-full">{t("book")}</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
