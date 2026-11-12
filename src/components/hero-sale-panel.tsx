import Image from "next/image";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { waLink } from "@/lib/site";

/** "Buy a car" tab of the home hero: OSK Auto teaser with the showroom photo. */
export async function HeroSalePanel() {
  const [t, m, s] = await Promise.all([getTranslations("heroTabs"), getTranslations("menu"), getTranslations("sales")]);
  return (
    <div className="grid overflow-hidden rounded-[var(--radius-panel)] border border-gold/40 bg-paper shadow-[0_18px_40px_-24px_rgba(13,52,64,.35)] md:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
        <Image src="/brand/osk-auto.svg" alt="OSK Auto by Karaçay" width={353} height={206} unoptimized className="h-12 w-auto self-start" />
        <h2 className="text-2xl font-extrabold md:text-3xl">{t("saleTitle")}</h2>
        <p className="text-ink-soft">{t("saleLead")}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/car-sales" className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-bold text-ink transition hover:bg-gold/85 active:scale-[0.98]">
            {m("saleCta")}
            <svg aria-hidden viewBox="0 0 16 16" className="btn-arrow size-3.5"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <a href={waLink(s("waText"))} target="_blank" rel="noopener" className="btn-wa"><WhatsAppIcon />{s("waCta")}</a>
        </div>
      </div>
      <div className="car-zoom relative aspect-[4/3] md:aspect-auto">
        <Image src="/media/osk/showroom-mercedes.webp" alt={s("imgAlt.mercedes")} fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover" />
      </div>
    </div>
  );
}
