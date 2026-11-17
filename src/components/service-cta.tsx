import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { waLink } from "@/lib/site";

/** Reserve + "ask on WhatsApp" buttons used on the service pages and the home page strip. */
export async function ServiceCta({ className = "" }: { className?: string }) {
  const t = await getTranslations("service");
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Link href="/car-sales#service-request" className="btn-ink">{t("reserveCta")}</Link>
      <a href={waLink(t("waText"))} className="btn-wa" target="_blank" rel="noopener"><WhatsAppIcon />{t("waCta")}</a>
      <Link href="/car-sales#service-track" className="btn-quiet">{t("trackCta")}</Link>
    </div>
  );
}

/** Banner on rental pages: the workshop is in the same building. */
export async function ServiceBanner() {
  const t = await getTranslations("service");
  return (
    <aside aria-labelledby="svc-banner" className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
      <h2 id="svc-banner" className="text-base font-extrabold">{t("bannerTitle")}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t("bannerText")}</p>
      <Link href="/car-sales#service-request" className="mt-2 inline-block text-sm font-semibold text-bougain underline-offset-2 hover:underline">{t("bannerCta")}</Link>
    </aside>
  );
}
