"use client";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { CarImage } from "./car-image";
import { money, queryToState } from "@/lib/search-params";

type Result = {
  slug: string; name: string; class: string; bodyType: string; transmission: string; fuel: string; seats: number; images: string[]; dailyRate: string;
  availability: { available: boolean; count: number; total: number };
  quote: { days: number; total: string; averageDaily: string; deposit: string; discountPercent: string; campaignFreeDays?: number } | null;
};

export function Results() {
  const t = useTranslations("results");
  const tc = useTranslations("classes");
  const tx = useTranslations("transmission");
  const tcar = useTranslations("car");
  const tcamp = useTranslations("campaign");
  const locale = useLocale();
  const params = useSearchParams();
  const state = queryToState(params);
  const [cls, setCls] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [sort, setSort] = useState<"high" | "low">("high"); // old site default: price high to low
  const tb = useTranslations("bodyType");
  const [nonce, setNonce] = useState(0);
  const qs = params.toString();
  const reqKey = `${qs}|${locale}|${nonce}`;
  const [res, setRes] = useState<{ key: string; data?: { results: Result[]; days: number | null }; error?: boolean } | null>(null);

  useEffect(() => {
    if (!queryToState(new URLSearchParams(qs))) return;
    let alive = true;
    fetch(`/api/v1/availability?${qs}&locale=${locale}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(
        (d) => alive && setRes({ key: reqKey, data: d }),
        () => alive && setRes({ key: reqKey, error: true }),
      );
    return () => {
      alive = false;
    };
  }, [reqKey, qs, locale]);

  const current = res?.key === reqKey ? res : null;
  const data = current?.data ?? null;
  const error = Boolean(current?.error);
  const load = () => setNonce((n) => n + 1);

  const classes = useMemo(() => [...new Set((data?.results ?? []).map((r) => r.class))], [data]);
  const bodies = useMemo(() => [...new Set((data?.results ?? []).map((r) => r.bodyType))], [data]);
  const count = (k: "class" | "bodyType", v: string) => (data?.results ?? []).filter((r) => r[k] === v).length;
  const price = (r: Result) => Number(r.quote?.total ?? r.dailyRate);
  const shown = (data?.results ?? [])
    .filter((r) => (!cls || r.class === cls) && (!body || r.bodyType === body) && (!auto || r.transmission === "AUTOMATIC"))
    .sort((a, b) => Number(b.availability.available) - Number(a.availability.available) || (sort === "high" ? price(b) - price(a) : price(a) - price(b)));

  if (!state) return null;
  if (error)
    return (
      <div role="alert" className="rounded-2xl bg-paper p-6">
        <p>{t("error")}</p>
        <button className="btn-quiet mt-4" onClick={load}>{t("retry")}</button>
      </div>
    );
  if (!data)
    return (
      <p aria-live="polite" className="py-10 text-ink-soft">
        {t("loading")}
      </p>
    );

  const fmtDate = (d: string, time: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`)) + ` ${time}`;
  return (
    <div>
      <p className="text-ink-soft">
        {data.days ? t("summary", { days: data.days, from: fmtDate(state.pickupDate, state.pickupTime), to: fmtDate(state.returnDate, state.returnTime) }) : null}
      </p>
      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("filterClass")}>
          <span className="mr-1 text-sm text-ink-soft">{t("filterClass")}</span>
          <Chip active={!cls} onClick={() => setCls(null)}>{t("filterAll")}</Chip>
          {classes.map((c) => (
            <Chip key={c} active={cls === c} onClick={() => setCls(cls === c ? null : c)}>{tc(c)} ({count("class", c)})</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("filterType")}>
          <span className="mr-1 text-sm text-ink-soft">{t("filterType")}</span>
          <Chip active={!body} onClick={() => setBody(null)}>{t("filterAll")}</Chip>
          {bodies.map((b) => (
            <Chip key={b} active={body === b} onClick={() => setBody(body === b ? null : b)}>{tb(b)} ({count("bodyType", b)})</Chip>
          ))}
          <Chip active={auto} onClick={() => setAuto(!auto)}>{tx("AUTOMATIC")}</Chip>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          {t("sort")}
          <select className="field !w-auto !py-1.5" value={sort} onChange={(e) => setSort(e.target.value as "high" | "low")}>
            <option value="high">{t("sortHigh")}</option>
            <option value="low">{t("sortLow")}</option>
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-ink-soft">{t("noResults")}</p>
      ) : (
        <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => {
            const ok = r.availability.available && r.quote;
            return (
              <li key={r.slug} className={ok ? "" : "opacity-60"}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <CarImage src={r.images[0]} alt={r.name} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{r.name} <span className="text-sm font-normal text-ink-soft">{tcar("orSimilarShort")}</span></h2>
                    <p className="text-sm text-ink-soft">{tc(r.class)}, {tx(r.transmission)}, {tcar("seats", { n: r.seats })}</p>
                  </div>
                  {r.quote && (
                    <p className="text-right">
                      <span className="block font-display text-2xl font-extrabold">{money(r.quote.total, locale)}</span>
                      <span className="text-xs text-ink-soft">{money(r.quote.averageDaily, locale)} {t("perDay")}</span>
                    </p>
                  )}
                </div>
                {!ok && <p className="mt-2 text-sm font-semibold text-ink-soft">{t("soldOut")}</p>}
                {r.quote && (r.quote.campaignFreeDays ?? 0) > 0 && <p className="text-xs font-semibold text-bougain">{tcamp("applied", { days: r.quote.campaignFreeDays! })}</p>}
                {r.quote && Number(r.quote.discountPercent) > 0 && <p className="text-xs text-ink-soft">{t("discount", { percent: Number(r.quote.discountPercent) })}</p>}
                {ok ? (
                  <Link href={`/cars/${r.slug}?${qs}`} className="btn-ink mt-4 w-full">{t("select")}</Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? "border-ink bg-ink text-white" : "border-ink/15 hover:border-ink/40"}`}>
      {children}
    </button>
  );
}
