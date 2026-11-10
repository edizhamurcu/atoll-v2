import { getTranslations } from "next-intl/server";
import Decimal from "decimal.js";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/search-params";
import { CAMPAIGNS, campaignFor } from "@/content/campaigns";
import { CarImage } from "./car-image";

/** Banner on a campaign car's page (src/content/campaigns.ts). */
export async function CampaignBanner({ slug }: { slug: string }) {
  if (!campaignFor(slug)) return null;
  const t = await getTranslations("campaign");
  return (
    <div className="rounded-2xl border border-bougain/30 bg-bougain/8 p-4">
      <p className="flex items-center gap-2">
        <span className="rounded-full bg-bougain px-2.5 py-0.5 text-xs font-bold text-white">{t("tag")}</span>
        <span className="font-bold text-ink">{t("short")}</span>
      </p>
      <p className="mt-2 text-sm text-ink-soft">{t("detail")}</p>
      <Link href="/special-offers#campaign" className="mt-2 inline-block text-sm font-semibold text-bougain underline-offset-2 hover:underline">{t("more")}</Link>
    </div>
  );
}

/** Campaign cards at the top of /special-offers: one card per campaign car with a 30-day example. */
export async function CampaignOffers({ locale }: { locale: string }) {
  const t = await getTranslations("campaign");
  const slugs = CAMPAIGNS.flatMap((c) => c.models);
  const models = await db.vehicleModel.findMany({ where: { slug: { in: slugs }, active: true } });
  const ordered = slugs.map((s) => models.find((m) => m.slug === s)).filter((m) => m !== undefined);
  if (!ordered.length) return null;
  return (
    <section id="campaign" aria-labelledby="campaign-title" className="mt-8 scroll-mt-28 rounded-[2rem] bg-bougain p-5 text-white md:p-8">
      <p className="w-fit rounded-full bg-white px-3 py-1 text-sm font-bold text-bougain">{t("short")}</p>
      <h2 id="campaign-title" className="mt-3 text-3xl font-extrabold">{t("offersTitle")}</h2>
      <p className="mt-2 max-w-prose text-white/90">{t("offersLead")}</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {ordered.map((m) => {
          const c = campaignFor(m.slug)!;
          const rate = new Decimal(m.dailyRate.toString());
          const normal = rate.mul(c.minDays);
          const offer = rate.mul(c.minDays - c.freeDays);
          return (
            <li key={m.slug} className="flex flex-col overflow-hidden rounded-[1.5rem] bg-paper text-ink">
              <div className="relative aspect-[4/3]">
                <CarImage src={m.images[0]} alt={`${m.make} ${m.model}`} sizes="(min-width:640px) 360px, 100vw" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-bold">{m.make} {m.model}</h3>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t("normal")}</dt><dd className="tabular-nums text-ink-soft line-through">{money(normal.toFixed(2), locale)}</dd></div>
                  <div className="flex justify-between gap-3 text-base font-bold"><dt>{t("campaignPrice")}</dt><dd className="tabular-nums text-bougain">{money(offer.toFixed(2), locale)}</dd></div>
                </dl>
                <p className="mt-2 w-fit rounded-full bg-bougain/10 px-2.5 py-0.5 text-xs font-bold text-bougain">{t("save", { amount: money(normal.minus(offer).toFixed(2), locale) })}</p>
                <Link href={`/cars/${m.slug}`} className="btn-primary mt-5 !py-2.5 text-sm">{t("cta")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-sm text-white/85">{t("example")} {t("terms")}</p>
    </section>
  );
}
