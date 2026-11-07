import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { WHATSAPP, PHONE, EMAIL } from "@/lib/contact";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const n = await getTranslations("nav");
  return (
    <footer className="mt-24 border-t border-ink/10 bg-paper text-ink-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Image src="/brand/atoll-logo.png" alt="Atoll Rent a Car" width={318} height={141} className="h-14 w-auto" />
          <p className="mt-4 max-w-sm">{t("address")}</p>
          <p className="mt-2 max-w-sm text-sm text-ink-soft/80">{t("hours")}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2">
          <Link href="/cars" className="hover:text-ink">{n("cars")}</Link>
          <Link href="/rental-terms" className="hover:text-ink">{n("terms")}</Link>
          <Link href="/contact" className="hover:text-ink">{n("contact")}</Link>
        </nav>
        <div className="flex flex-col gap-2">
          <a href={`https://wa.me/${WHATSAPP.replace(/\D/g, "")}`} className="hover:text-ink" rel="noopener">WhatsApp {WHATSAPP}</a>
          <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="hover:text-ink">{PHONE}</a>
          <a href={`mailto:${EMAIL}`} className="hover:text-ink">{EMAIL}</a>
        </div>
      </div>
      <p className="border-t border-ink/10 py-5 text-center text-xs text-ink-soft/70">© {t("rights")}</p>
    </footer>
  );
}
