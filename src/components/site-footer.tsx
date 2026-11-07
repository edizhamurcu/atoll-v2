import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { WHATSAPP, PHONE, EMAIL } from "@/lib/contact";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const n = await getTranslations("nav");
  return (
    <footer className="mt-24 bg-ink text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl font-extrabold text-white">atoll<span className="text-bougain">.</span></p>
          <p className="mt-4 max-w-sm">{t("address")}</p>
          <p className="mt-2 max-w-sm text-sm text-white/60">{t("hours")}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2">
          <Link href="/cars" className="hover:text-white">{n("cars")}</Link>
          <Link href="/rental-terms" className="hover:text-white">{n("terms")}</Link>
          <Link href="/contact" className="hover:text-white">{n("contact")}</Link>
        </nav>
        <div className="flex flex-col gap-2">
          <a href={`https://wa.me/${WHATSAPP.replace(/\D/g, "")}`} className="hover:text-white" rel="noopener">WhatsApp {WHATSAPP}</a>
          <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="hover:text-white">{PHONE}</a>
          <a href={`mailto:${EMAIL}`} className="hover:text-white">{EMAIL}</a>
        </div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-white/50">© {t("rights")}</p>
    </footer>
  );
}
