import { getTranslations } from "next-intl/server";
import { SITE, waLink } from "@/lib/site";

/** Special offers page body while no campaign is running (campaigns cancelled 2026-11-11). */
export async function SpecialOffers() {
  const t = await getTranslations("campaign");
  return (
    <section aria-labelledby="offers-none" className="mt-8 rounded-[2rem] bg-paper p-6 md:p-10">
      <h2 id="offers-none" className="text-2xl font-extrabold md:text-3xl">{t("noneTitle")}</h2>
      <p className="mt-3 max-w-prose text-lg text-ink-soft">{t("noneText")}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="btn-primary" href={waLink(t("waText"))} target="_blank" rel="noopener">{t("whatsapp")}</a>
        <a className="btn-quiet" href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
      </div>
    </section>
  );
}
