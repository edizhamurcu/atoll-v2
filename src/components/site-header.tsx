import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-30 border-b border-ink/8 bg-stone/85 backdrop-blur-md">
      <div className="mx-auto flex h-[4.75rem] max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="shrink-0" aria-label="Atoll Rent a Car, home">
          <Image src="/brand/atoll-logo.png" alt="Atoll Rent a Car" width={318} height={141} priority className="h-12 w-auto md:h-[3.25rem]" />
        </Link>
        <nav aria-label="Main" className="ml-auto hidden items-center gap-6 text-[0.95rem] text-ink-soft md:flex">
          <Link href="/cars" className="hover:text-ink">{t("cars")}</Link>
          <Link href="/rental-terms" className="hover:text-ink">{t("terms")}</Link>
          <Link href="/contact" className="hover:text-ink">{t("contact")}</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <LocaleSwitcher label={t("language")} />
          <Link href="/#search" className="btn-primary hidden !px-5 !py-2 text-sm sm:inline-flex">{t("book")}</Link>
        </div>
      </div>
    </header>
  );
}
