import { getTranslations } from "next-intl/server";
import Decimal from "decimal.js";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/search-params";
import { SITE, waLink } from "@/lib/site";
import { CAMPAIGNS, campaignFor } from "@/content/campaigns";
import { CarImage } from "./car-image";

/** Offer banner on a campaign car's page. */
export async function CampaignBanner({ slug }: { slug: string }) {
  const c = campaignFor(slug);
  if (!c) return null;
  const t = await getTranslations("campaign");
  return (
    <div className="rounded-2xl border border-bougain/30 bg-bougain/8 p-4">
      <p className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-bougain px-2.5 py-0.5 text-xs font-bold text-white">{t("tag")}</span>
        <span className="font-bold text-ink">{t("weekShort")}</span>
      </p>
      <p className="mt-2 text-sm text-ink-soft">{t("weekDetail")}</p>
      <Link href="/special-offers" className="mt-2 inline-block text-sm font-semibold text-bougain underline-offset-2 hover:underline">{t("more")}</Link>
    </div>
  );
}

/** Special offers page: one car per class, rent 7 days and pay 6 (src/content/campaigns.ts). */
export async function SpecialOffers({ locale }: { locale: string }) {
  const [t, tc, tcar, tx, tf] = await Promise.all([
    getTranslations("campaign"),
    getTranslations("classes"),
    getTranslations("car"),
    getTranslations("transmission"),
    getTranslations("fuel"),
  ]);
  const camp = CAMPAIGNS[0];
  const slugs = camp && camp.models !== "all" ? [...camp.models] : [];
  const rows = slugs.length ? await db.vehicleModel.findMany({ where: { slug: { in: slugs }, active: true } }) : [];
  const cars = slugs.map((s) => rows.find((m) => m.slug === s)).filter((m) => m !== undefined);

  if (!camp || !cars.length)
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

  const paid = camp.minDays - camp.freeDays;
  return (
    <section id="week" aria-labelledby="week-title" className="mt-8 scroll-mt-28 rounded-[2rem] bg-ink p-5 text-white md:p-8">
      <p className="w-fit rounded-full bg-gold px-3 py-1 text-sm font-bold text-ink">{t("weekShort")}</p>
      <h2 id="week-title" className="mt-3 text-3xl font-extrabold md:text-4xl">{t("weekTitle")}</h2>
      <p className="mt-2 max-w-prose text-white/85">{t("weekLead")}</p>

      <ol aria-hidden className="mt-6 grid max-w-xl grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: camp.minDays }, (_, i) => {
          const free = i >= paid;
          return (
            <li key={i} className={`flex aspect-square flex-col items-center justify-center rounded-xl ${free ? "rotate-3 bg-gold text-ink shadow-lg" : "bg-white/10"}`}>
              <span className="text-lg font-extrabold sm:text-xl">{i + 1}</span>
              {free && <span className="text-[0.6rem] font-bold sm:text-[0.7rem]">{t("free")}</span>}
            </li>
          );
        })}
      </ol>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((m) => {
          const rate = new Decimal(m.dailyRate.toString());
          const normal = rate.mul(camp.minDays);
          const offer = rate.mul(paid);
          return (
            <li key={m.slug} className="flex flex-col overflow-hidden rounded-[1.5rem] bg-paper text-ink">
              <div className="relative aspect-[4/3]">
                <CarImage src={m.images[0]} alt={`${m.make} ${m.model}`} sizes="(min-width:1024px) 340px, (min-width:640px) 50vw, 100vw" />
                <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">{tc(m.class)}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-bold">{m.make} {m.model} <span className="text-sm font-normal text-ink-soft">{tcar("orSimilarShort")}</span></h3>
                <ul className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold text-ink-soft">
                  {[tcar("seats", { n: m.seats }), tx(m.transmission), tf(m.fuel), ...(m.airCon ? [tcar("airCon")] : [])].map((f) => (
                    <li key={f} className="rounded-full bg-stone px-2.5 py-1">{f}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-ink-soft">{t("daily", { price: money(rate.toFixed(2), locale) })}</p>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t("normal7")}</dt><dd className="tabular-nums text-ink-soft line-through">{money(normal.toFixed(2), locale)}</dd></div>
                  <div className="flex justify-between gap-3 text-base font-bold"><dt>{t("offer7")}</dt><dd className="tabular-nums text-xl text-bougain">{money(offer.toFixed(2), locale)}</dd></div>
                </dl>
                <div className="mt-auto pt-5"><Link href={`/cars/${m.slug}`} className="btn-primary w-full !py-2.5 text-sm">{t("cta")}</Link></div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-white/75">{t("weekTerms")}</p>
    </section>
  );
}
