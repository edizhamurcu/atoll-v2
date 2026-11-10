import { getTranslations } from "next-intl/server";
import Decimal from "decimal.js";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/search-params";
import { MONTH_CAMPAIGN, WEEK_CAMPAIGN, campaignFor } from "@/content/campaigns";
import { CarImage } from "./car-image";

/** Campaign banner on every car page: the weekly offer for all cars, plus the model's own offer if it has one. */
export async function CampaignBanner({ slug }: { slug: string }) {
  const t = await getTranslations("campaign");
  const own = campaignFor(slug);
  return (
    <div className="rounded-2xl border border-bougain/30 bg-bougain/8 p-4">
      <span className="rounded-full bg-bougain px-2.5 py-0.5 text-xs font-bold text-white">{t("tag")}</span>
      <ul className="mt-2 space-y-1.5">
        <li><span className="font-bold text-ink">{t("weekShort")}</span> <span className="text-sm text-ink-soft">{t("weekDetail")}</span></li>
        {own && <li><span className="font-bold text-ink">{t("short")}</span> <span className="text-sm text-ink-soft">{t("detail")}</span></li>}
      </ul>
      <Link href="/special-offers" className="mt-2 inline-block text-sm font-semibold text-bougain underline-offset-2 hover:underline">{t("more")}</Link>
    </div>
  );
}

/** Special offers page body: weekly offer for every car, then the monthly offer for selected cars. */
export async function SpecialOffers({ locale }: { locale: string }) {
  const [t, tc] = await Promise.all([getTranslations("campaign"), getTranslations("classes")]);
  const classes = ["ECONOMY", "SUV", "LUXURY"] as const;
  const cheapest = await Promise.all(
    classes.map((c) => db.vehicleModel.findFirst({ where: { class: c, active: true }, orderBy: { dailyRate: "asc" }, select: { make: true, model: true, class: true, dailyRate: true, images: true } })),
  );
  const examples = cheapest.filter((m) => m !== null);
  const w = WEEK_CAMPAIGN;
  return (
    <>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">{t("pageLead")}</p>

      <section id="week" aria-labelledby="week-title" className="mt-8 scroll-mt-28 overflow-hidden rounded-[2rem] bg-ink p-5 text-white md:p-8">
        <p className="w-fit rounded-full bg-gold px-3 py-1 text-sm font-bold text-ink">{t("weekShort")}</p>
        <h2 id="week-title" className="mt-3 text-3xl font-extrabold md:text-4xl">{t("weekTitle")}</h2>
        <p className="mt-2 max-w-prose text-white/85">{t("weekLead")}</p>

        <ol aria-label={t("weekShort")} className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: w.minDays }, (_, i) => {
            const free = i >= w.minDays - w.freeDays;
            return (
              <li
                key={i}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-center sm:rounded-2xl ${free ? "rotate-3 bg-gold text-ink shadow-lg" : "bg-white/10"}`}
              >
                <span className="text-lg font-extrabold sm:text-2xl">{i + 1}</span>
                <span className={`hidden text-[0.7rem] font-semibold sm:block ${free ? "" : "text-white/60"}`}>{free ? t("free") : t("dayN", { n: i + 1 })}</span>
                {free && <span className="text-[0.6rem] font-bold sm:hidden">{t("free")}</span>}
              </li>
            );
          })}
        </ol>

        {examples.length > 0 && (
          <>
            <h3 className="mt-8 text-lg font-bold">{t("examplesTitle")}</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {examples.map((m) => {
                const rate = new Decimal(m.dailyRate.toString());
                return (
                  <li key={m.class} className="overflow-hidden rounded-2xl bg-white text-ink">
                    <div className="relative aspect-[16/10]">
                      <CarImage src={m.images[0]} alt={`${m.make} ${m.model}`} sizes="(min-width:640px) 260px, 100vw" />
                    </div>
                    <div className="flex items-end justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-soft">{tc(m.class)}</p>
                        <p className="font-bold">{m.make} {m.model}</p>
                      </div>
                      <p className="shrink-0 text-right">
                        <span className="block text-sm text-ink-soft line-through">{money(rate.mul(w.minDays).toFixed(2), locale)}</span>
                        <span className="text-xl font-extrabold text-bougain">{money(rate.mul(w.minDays - w.freeDays).toFixed(2), locale)}</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <Link href="/#search" className="btn-primary mt-6">{t("pickDates")}</Link>
        <p className="mt-5 text-sm text-white/70">{t("example")} {t("weekTerms")}</p>
      </section>

      <CampaignOffers locale={locale} />
    </>
  );
}

/** Campaign cards at the top of /special-offers: one card per campaign car with a 30-day example. */
export async function CampaignOffers({ locale }: { locale: string }) {
  const t = await getTranslations("campaign");
  const slugs = MONTH_CAMPAIGN.models === "all" ? [] : [...MONTH_CAMPAIGN.models];
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
