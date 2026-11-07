import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getExtras, getModel } from "@/server/queries";
import type { Locale } from "@/server/catalog";
import { CarImage } from "@/components/car-image";
import { BookingPanel } from "@/components/booking-panel";
import { SearchSection, SearchSkeleton } from "@/components/search-section";
import { money } from "@/lib/search-params";

export default function CarPage({ params }: PageProps<"/[locale]/cars/[slug]">) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-stone-deep" />}>
        <CarDetail params={params} />
      </Suspense>
    </div>
  );
}

async function CarDetail({ params }: { params: PageProps<"/[locale]/cars/[slug]">["params"] }) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const [m, extras] = await Promise.all([getModel(slug, locale), getExtras(locale)]);
  if (!m) notFound();
  const [t, tc, tx, tf] = await Promise.all([getTranslations("car"), getTranslations("classes"), getTranslations("transmission"), getTranslations("fuel")]);
  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="text-ink-soft">{tc(m.class)}</p>
        <h1 className="text-4xl font-extrabold md:text-5xl">{m.name}</h1>
        <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-[var(--radius-panel)]">
          <CarImage src={m.images[0]} alt={m.name} sizes="(min-width:1024px) 60vw, 100vw" priority />
        </div>
        {m.images.length > 1 && (
          <ul className="mt-3 grid grid-cols-4 gap-3">
            {m.images.slice(1, 5).map((src) => (
              <li key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <CarImage src={src} alt="" sizes="15vw" />
              </li>
            ))}
          </ul>
        )}
        <h2 className="mt-10 text-2xl font-bold">{t("specs")}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          <Spec k={tx(m.transmission)} />
          <Spec k={tf(m.fuel)} />
          <Spec k={t("seats", { n: m.seats })} />
          {m.airCon && <Spec k={t("airCon")} />}
          {m.engineLitres && <Spec k={t("engine", { l: m.engineLitres })} />}
          <Spec k={t("fleet", { n: m.fleetSize })} />
        </dl>
        <p className="mt-6 max-w-prose text-sm text-ink-soft">{t("orSimilar", { name: m.name })}</p>
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-panel)] bg-paper p-5 shadow-[0_18px_40px_-24px_rgba(13,52,64,.35)]">
          <h2 className="text-2xl font-bold">{t("bookPanel")}</h2>
          <p className="mt-1 text-ink-soft">{t("from", { price: money(m.dailyRate, locale) })}</p>
          <div className="mt-4">
            <Suspense fallback={<SearchSkeleton />}>
              <SearchSection locale={locale} target={`/cars/${slug}`} stacked />
            </Suspense>
          </div>
          <div className="mt-6">
            <Suspense>
              <BookingPanel slug={slug} extras={extras} />
            </Suspense>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Spec({ k }: { k: string }) {
  return <dd className="border-l-2 border-aegean pl-3">{k}</dd>;
}
