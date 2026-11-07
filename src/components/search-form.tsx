"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { defaultState, queryToState, stateToQuery, TIMES, toIso, type SearchState } from "@/lib/search-params";

export interface SearchOptions {
  locations: { slug: string; name: string; isAirport: boolean; pickupFee: string }[];
  zones: { slug: string; name: string; areas: string[] }[];
}

export function SearchForm({ options, target = "/cars", compact = false, stacked = false }: { options: SearchOptions; target?: string; compact?: boolean; stacked?: boolean }) {
  const t = useTranslations("search");
  const router = useRouter();
  const params = useSearchParams();
  const first = options.locations[0]?.slug ?? "";
  const [s, setS] = useState<SearchState>(() => queryToState(params) ?? defaultState(first));
  const [same, setSame] = useState(s.returnLocation === s.pickupLocation);
  const [delivery, setDelivery] = useState(Boolean(s.deliveryZone));
  const [error, setError] = useState<string | null>(null);

  // Sync with URL changes (e.g. "change search") without an effect: adjust state during render.
  const qs = params.toString();
  const [prevQs, setPrevQs] = useState(qs);
  if (qs !== prevQs) {
    setPrevQs(qs);
    const fromUrl = queryToState(params);
    if (fromUrl) setS(fromUrl);
  }

  const set = <K extends keyof SearchState>(k: K, v: SearchState[K]) => setS((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = { ...s, returnLocation: same ? s.pickupLocation : s.returnLocation, deliveryZone: delivery ? s.deliveryZone ?? options.zones[0]?.slug ?? null : null };
    const p = new Date(toIso(next.pickupDate, next.pickupTime)), r = new Date(toIso(next.returnDate, next.returnTime));
    if (r <= p) return setError(t("errorRange"));
    if (p.getTime() < Date.now() + 2 * 3_600_000) return setError(t("errorLead"));
    setError(null);
    router.push(`${target}?${stateToQuery(next).toString()}`);
  }

  const grid = stacked ? "grid-cols-1" : compact ? "md:grid-cols-[1.3fr_1fr_1fr_auto]" : "md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]";
  return (
    <form onSubmit={submit} className={stacked ? "" : "rounded-[var(--radius-panel)] bg-paper p-5 shadow-[0_1px_0_rgba(13,52,64,.06),0_18px_40px_-24px_rgba(13,52,64,.35)] md:p-6"} noValidate>
      <div className={`grid gap-4 ${grid}`}>
        <div>
          <label className="label" htmlFor="pickupLocation">{t("pickupLocation")}</label>
          <select id="pickupLocation" className="field" value={s.pickupLocation} onChange={(e) => set("pickupLocation", e.target.value)}>
            {options.locations.map((l) => (
              <option key={l.slug} value={l.slug}>{l.name}</option>
            ))}
          </select>
          {!same && (
            <div className="mt-3">
              <label className="label" htmlFor="returnLocation">{t("returnLocation")}</label>
              <select id="returnLocation" className="field" value={s.returnLocation} onChange={(e) => set("returnLocation", e.target.value)}>
                {options.locations.map((l) => (
                  <option key={l.slug} value={l.slug}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <fieldset>
          <legend className="label">{t("pickupDate")}</legend>
          <div className="flex gap-2">
            <input type="date" aria-label={t("pickupDate")} className="field" value={s.pickupDate} onChange={(e) => set("pickupDate", e.target.value)} required />
            <select aria-label={t("time")} className="field !w-[6.5rem]" value={s.pickupTime} onChange={(e) => set("pickupTime", e.target.value)}>
              {TIMES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">{t("returnDate")}</legend>
          <div className="flex gap-2">
            <input type="date" aria-label={t("returnDate")} className="field" value={s.returnDate} min={s.pickupDate} onChange={(e) => set("returnDate", e.target.value)} required />
            <select aria-label={t("time")} className="field !w-[6.5rem]" value={s.returnTime} onChange={(e) => set("returnTime", e.target.value)}>
              {TIMES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
        </fieldset>
        {compact && (
          <div className="flex items-end">
            <button className="btn-primary w-full md:w-auto">{t("submit")}</button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-soft">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="size-4 accent-[var(--color-aegean)]" checked={same} onChange={(e) => setSame(e.target.checked)} />
          {t("sameReturn")}
        </label>
        {options.zones.length > 0 && (
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="size-4 accent-[var(--color-aegean)]" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} />
            {t("delivery")}
          </label>
        )}
        {delivery && (
          <select aria-label={t("deliveryZone")} className="field !w-auto !py-1.5" value={s.deliveryZone ?? options.zones[0]?.slug} onChange={(e) => set("deliveryZone", e.target.value)}>
            {options.zones.map((z) => (
              <option key={z.slug} value={z.slug}>{z.name} ({z.areas.slice(0, 3).join(", ")}…)</option>
            ))}
          </select>
        )}
        {!compact && <button className={`${stacked ? "btn-quiet" : "btn-primary"} ml-auto w-full sm:w-auto`}>{t("submit")}</button>}
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-alert">{error}</p>}
    </form>
  );
}
