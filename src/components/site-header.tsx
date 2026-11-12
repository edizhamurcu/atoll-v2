import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { SITE, telLink, waLink } from "@/lib/site";
import { LocaleSwitcher } from "./locale-switcher";
import { MainNav, MainNavView, MobileMenu, MobileMenuView, type NavLabels } from "./main-nav";

/** Header: brand logos, main nav (rental | sales groups, then About · Discover · Contact), language, booking CTA. */
export async function SiteHeader() {
  const [t, m, s] = await Promise.all([getTranslations("nav"), getTranslations("menu"), getTranslations("sales")]);
  const navKeys = ["rentCars", "carSales", "aboutUs", "contactUs", "carPrices", "rentalTerms", "specialOffers", "agreement", "guide", "drivingSouth", "blog", "home", "menu", "close"] as const;
  const menuKeys = ["discover", "rentPitch", "rentCta", "fleet", "fleetDesc", "pricesDesc", "termsDesc", "offersDesc", "agreementDesc", "salePitch", "saleCta", "showroom", "showroomDesc", "stock", "stockDesc", "service", "serviceDesc", "whatsapp", "guideDesc", "southDesc", "blogDesc", "call", "general", "rentGroup", "saleGroup"] as const;
  const labels = {
    ...Object.fromEntries(navKeys.map((k) => [k, t(k)])),
    ...Object.fromEntries(menuKeys.map((k) => [k, m(k)])),
    phone: SITE.phone,
    telHref: telLink(SITE.phone),
    waHref: waLink(),
    waSaleHref: waLink(s("waText")),
  } as NavLabels;
  return (
    <header className="sticky top-0 z-30 border-b border-ink/8 bg-stone/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.75rem] max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-5 lg:gap-3">
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4 lg:gap-3">
          <Link href="/" className="shrink-0" aria-label="Atoll Rent A Car, home">
            <Image src="/brand/atoll-logo.png" alt="Atoll Rent A Car" width={318} height={141} priority className="h-11 w-auto sm:h-14 lg:h-12" />
          </Link>
          {/* Sister company in the same building: its logo leads to the sales side */}
          <span aria-hidden="true" className="h-9 w-px bg-ink/15 sm:h-11 lg:h-10" />
          <Link href="/car-sales" className="shrink-0 opacity-90 transition-opacity hover:opacity-100" aria-label="OSK Auto by Karaçay">
            <Image src="/brand/osk-auto.svg" alt="OSK Auto by Karaçay" width={353} height={206} unoptimized priority className="h-11 w-auto sm:h-14 lg:h-12" />
          </Link>
        </div>

        <Suspense fallback={<MainNavView labels={labels} path={null} />}>
          <MainNav labels={labels} />
        </Suspense>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <LocaleSwitcher label={t("language")} />
          <Link href="/#search" className="btn-primary hidden whitespace-nowrap !px-5 !py-2 text-sm sm:inline-flex lg:hidden xl:inline-flex">{t("book")}</Link>
          <Suspense fallback={<MobileMenuView labels={labels} path={null} />}>
            <MobileMenu labels={labels} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
