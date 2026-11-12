"use client";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { money } from "@/lib/search-params";
import { CarImage } from "./car-image";
import { Carousel } from "./carousel";

export type FleetItem = {
  slug: string;
  name: string;
  image?: string;
  cls: string;
  gear: string;
  automatic: boolean;
  seats: number;
  seatsLabel: string;
  dailyRate: string;
  fromLabel: string;
  excess: string;
  campaign: boolean;
  popular: boolean;
};
export type FleetGroup = { cls: string; label: string; items: FleetItem[] };
type Labels = Record<
  "all" | "family" | "automatic" | "budget" | "luxury" | "filterLabel" | "orSimilar" | "unlimitedKm" | "airCon" | "excess" | "popular" |
  "campaign" | "perDay" | "total" | "soldOut" | "datesNote" | "empty" | "prev" | "next",
  string
>;
type Quote = { total: string; days: number; available: boolean };
type Filter = "all" | "family" | "automatic" | "budget" | "luxury";

export const SEARCH_EVENT = "atoll:search";
export const SEARCH_KEY = "atoll:lastSearch";
const LUX = new Set(["LUXURY", "PREMIUM", "SPORT"]);
const BUDGET_MAX = 30;

const match: Record<Filter, (m: FleetItem) => boolean> = {
  all: () => true,
  family: (m) => m.seats >= 7,
  automatic: (m) => m.automatic,
  budget: (m) => Number(m.dailyRate) <= BUDGET_MAX,
  luxury: (m) => LUX.has(m.cls),
};

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/**
 * Home / fleet: class rails with quick filters, campaign + "most booked" badges, trust chips, and,
 * once the visitor has picked dates in the search form, the real total for those dates on every card.
 */
export function FleetBrowser({ groups, labels: l, locale }: { groups: FleetGroup[]; labels: Labels; locale: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [qs, setQs] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote> | null>(null);

  // Dates: URL (fleet page after a search) > last valid search form state (event / sessionStorage).
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search);
    const initial = fromUrl.get("pickupAt") ? fromUrl.toString() : (() => { try { return sessionStorage.getItem(SEARCH_KEY); } catch { return null; } })();
    const timer = setTimeout(() => { if (initial) setQs(initial); }, 0);
    const on = (e: Event) => setQs((e as CustomEvent<string>).detail);
    window.addEventListener(SEARCH_EVENT, on);
    return () => { clearTimeout(timer); window.removeEventListener(SEARCH_EVENT, on); };
  }, []);

  useEffect(() => {
    if (!qs) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      const p = new URLSearchParams(qs);
      const q = new URLSearchParams({ pickupAt: p.get("pickupAt") ?? "", returnAt: p.get("returnAt") ?? "", pickupLocation: p.get("pickupLocation") ?? "", returnLocation: p.get("returnLocation") ?? p.get("pickupLocation") ?? "", locale });
      if (p.get("deliveryZone")) q.set("deliveryZone", p.get("deliveryZone")!);
      fetch(`/api/v1/availability?${q}`, { signal: ctrl.signal, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { results?: { slug: string; availability: { available: boolean }; quote: { total: string; days: number } | null }[] } | null) => {
          if (!d?.results) return setQuotes(null);
          setQuotes(Object.fromEntries(d.results.filter((r) => r.quote).map((r) => [r.slug, { total: r.quote!.total, days: r.quote!.days, available: r.availability.available }])));
        })
        .catch(() => {});
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [qs, locale]);

  const shown = useMemo(
    () => groups.map((g) => ({ ...g, items: g.items.filter(match[filter]) })).filter((g) => g.items.length),
    [groups, filter],
  );
  const carQs = qs ? `?${qs}` : "";
  const chips: [Filter, string][] = [["all", l.all], ["family", l.family], ["automatic", l.automatic], ["budget", fill(l.budget, { price: money(BUDGET_MAX, locale) })], ["luxury", l.luxury]];

  return (
    <div>
      <div role="group" aria-label={l.filterLabel} className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${filter === k ? "border-ink bg-ink text-white" : "border-ink/15 bg-paper text-ink hover:border-ink/40"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {quotes && <p className="-mt-4 mb-6 text-sm text-ink-soft">{l.datesNote}</p>}

      {shown.length === 0 ? (
        <p className="text-ink-soft">{l.empty}</p>
      ) : (
        <div className="space-y-12">
          {shown.map((g) => (
            <Carousel
              key={g.cls}
              headingId={`cls-${g.cls}`}
              heading={<h3 id={`cls-${g.cls}`} className="text-xl font-bold">{g.label} <span className="text-base font-normal text-ink-soft">({g.items.length})</span></h3>}
              prevLabel={fill(l.prev, { cls: g.label })}
              nextLabel={fill(l.next, { cls: g.label })}
            >
              {g.items.map((m) => {
                const q = quotes?.[m.slug];
                return (
                  <li key={m.slug} className="w-64 shrink-0 snap-start">
                    <Link href={`/cars/${m.slug}${carQs}`} className="group block">
                      <div className="car-zoom relative aspect-[4/3] overflow-hidden rounded-2xl">
                        <CarImage src={m.image} alt={m.name} sizes="256px" />
                        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
                          {m.campaign && <span className="rounded-full bg-bougain px-2.5 py-1 text-[0.7rem] font-bold text-white shadow">{l.campaign}</span>}
                          {m.popular && <span className="rounded-full bg-gold px-2.5 py-1 text-[0.7rem] font-bold text-ink shadow">{l.popular}</span>}
                        </div>
                      </div>
                      <p className="mt-3 font-display text-lg font-bold group-hover:text-aegean">{m.name} <span className="text-sm font-normal text-ink-soft">{l.orSimilar}</span></p>
                      <p className="text-sm text-ink-soft">{m.gear}, {m.seatsLabel}</p>
                      <ul className="mt-2 flex flex-wrap gap-1 text-[0.7rem] font-semibold text-ink-soft">
                        <li className="rounded-full bg-paper px-2 py-0.5">{l.unlimitedKm}</li>
                        <li className="rounded-full bg-paper px-2 py-0.5">{l.airCon}</li>
                        <li className="rounded-full bg-paper px-2 py-0.5">{fill(l.excess, { amount: m.excess })}</li>
                      </ul>
                      {q ? (
                        q.available ? (
                          <p className="mt-2">
                            <span className="font-display text-lg font-extrabold">{fill(l.total, { days: q.days, price: money(q.total, locale) })}</span>
                            <span className="ml-1.5 text-xs text-ink-soft">{money(m.dailyRate, locale)} {l.perDay}</span>
                          </p>
                        ) : (
                          <p className="mt-2 text-sm font-semibold text-ink-soft">{l.soldOut}</p>
                        )
                      ) : (
                        <p className="mt-2 text-sm font-semibold">{m.fromLabel}</p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </Carousel>
          ))}
        </div>
      )}
    </div>
  );
}
