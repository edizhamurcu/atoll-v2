"use client";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { PublicSaleCar } from "@/server/sales";

export type StockLabels = Record<
  | "title" | "lead" | "count" | "allMakes" | "allBodies" | "allFuels" | "allGears" | "maxPrice" | "any" | "sort" | "sortNew" | "sortPriceUp"
  | "sortPriceDown" | "sortKm" | "ask" | "reserved" | "whatsapp" | "none" | "reset" | "photos" | "close" | "km" | "year"
  | "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC" | "LPG" | "AUTOMATIC" | "MANUAL" | "HATCHBACK" | "SEDAN" | "ESTATE" | "SUV" | "VAN",
  string
>;

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/** OSK Auto stock: filters (make, body, fuel, gearbox, max price), sort, cards with WhatsApp enquiry per car. */
export function SaleStock({ cars, l, locale, waBase, waNumber }: { cars: PublicSaleCar[]; l: StockLabels; locale: string; waBase: string; waNumber: string }) {
  const [make, setMake] = useState("");
  const [body, setBody] = useState("");
  const [fuel, setFuel] = useState("");
  const [gear, setGear] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("new");
  const [open, setOpen] = useState<PublicSaleCar | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const uniq = <T,>(xs: T[]) => [...new Set(xs)].filter(Boolean) as T[];
  const makes = uniq(cars.map((c) => c.make)).sort();
  const bodies = uniq(cars.map((c) => c.bodyType));
  const fuels = uniq(cars.map((c) => c.fuel));
  const prices = cars.map((c) => Number(c.price)).filter((n) => n > 0);
  const steps = [5000, 10000, 15000, 20000, 30000, 50000].filter((p) => prices.some((x) => x <= p));
  const nf = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : locale === "de" ? "de-DE" : locale === "ru" ? "ru-RU" : "en-GB");

  const list = useMemo(() => {
    const out = cars.filter((c) => (!make || c.make === make) && (!body || c.bodyType === body) && (!fuel || c.fuel === fuel) && (!gear || c.transmission === gear) && (!max || (c.price !== null && Number(c.price) <= Number(max))));
    const price = (c: PublicSaleCar) => (c.price === null ? Infinity : Number(c.price));
    if (sort === "up") out.sort((a, b) => price(a) - price(b));
    if (sort === "down") out.sort((a, b) => (b.price === null ? -1 : Number(b.price)) - (a.price === null ? -1 : Number(a.price)));
    if (sort === "km") out.sort((a, b) => a.mileageKm - b.mileageKm);
    return out;
  }, [cars, make, body, fuel, gear, max, sort]);

  const show = (c: PublicSaleCar) => { setOpen(c); dialog.current?.showModal(); };
  const reset = () => { setMake(""); setBody(""); setFuel(""); setGear(""); setMax(""); };
  const sel = "field !w-auto !py-2 text-sm";
  const title = (c: PublicSaleCar) => `${c.year} ${c.make} ${c.model}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {makes.length > 1 && <select aria-label={l.allMakes} className={sel} value={make} onChange={(e) => setMake(e.target.value)}><option value="">{l.allMakes}</option>{makes.map((m) => <option key={m}>{m}</option>)}</select>}
        {bodies.length > 1 && <select aria-label={l.allBodies} className={sel} value={body} onChange={(e) => setBody(e.target.value)}><option value="">{l.allBodies}</option>{bodies.map((b) => <option key={b} value={b!}>{l[b!]}</option>)}</select>}
        {fuels.length > 1 && <select aria-label={l.allFuels} className={sel} value={fuel} onChange={(e) => setFuel(e.target.value)}><option value="">{l.allFuels}</option>{fuels.map((f) => <option key={f} value={f}>{l[f]}</option>)}</select>}
        <select aria-label={l.allGears} className={sel} value={gear} onChange={(e) => setGear(e.target.value)}><option value="">{l.allGears}</option><option value="AUTOMATIC">{l.AUTOMATIC}</option><option value="MANUAL">{l.MANUAL}</option></select>
        {steps.length > 1 && <select aria-label={l.maxPrice} className={sel} value={max} onChange={(e) => setMax(e.target.value)}><option value="">{l.maxPrice}: {l.any}</option>{steps.map((p) => <option key={p} value={p}>{l.maxPrice}: £{nf.format(p)}</option>)}</select>}
        <select aria-label={l.sort} className={`${sel} sm:ml-auto`} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">{l.sortNew}</option><option value="up">{l.sortPriceUp}</option><option value="down">{l.sortPriceDown}</option><option value="km">{l.sortKm}</option>
        </select>
      </div>
      <p className="mt-3 text-sm text-ink-soft" aria-live="polite">{fill(l.count, { n: list.length })}</p>

      {list.length === 0 ? (
        <p className="mt-6 rounded-panel bg-paper p-6 text-ink-soft">{l.none} <button type="button" onClick={reset} className="font-semibold text-aegean underline underline-offset-2">{l.reset}</button></p>
      ) : (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c, i) => (
            <li key={c.id} data-reveal style={{ "--reveal-delay": `${(i % 3) * 70}ms` } as React.CSSProperties} className="flex flex-col overflow-hidden rounded-panel bg-paper">
              <button type="button" onClick={() => c.photos.length && show(c)} className="car-zoom relative block overflow-hidden bg-stone-deep" aria-label={c.photos.length > 1 ? `${title(c)}: ${fill(l.photos, { n: c.photos.length })}` : title(c)}>
                {c.photos[0] ? <Image unoptimized src={c.photos[0]} alt={title(c)} width={800} height={600} sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw" className="aspect-[4/3] w-full object-cover" /> : <span className="block aspect-[4/3]" />}
                {c.status === "RESERVED" && <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">{l.reserved}</span>}
                {c.photos.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-ink/75 px-2.5 py-1 text-xs font-semibold text-white">{fill(l.photos, { n: c.photos.length })}</span>}
              </button>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold leading-snug">{title(c)}</h3>
                <p className="mt-1 text-sm text-ink-soft">{nf.format(c.mileageKm)} {l.km} · {l[c.fuel]} · {l[c.transmission]}{c.bodyType ? ` · ${l[c.bodyType]}` : ""}{c.colour ? ` · ${c.colour}` : ""}</p>
                {c.note && <p className="mt-2 text-sm">{c.note}</p>}
                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  <p className="font-display text-2xl font-extrabold">{c.price ? `£${nf.format(Number(c.price))}` : <span className="text-base font-semibold text-ink-soft">{l.ask}</span>}</p>
                  <a href={`https://wa.me/${waNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`${waBase} ${title(c)}${c.price ? ` (£${c.price})` : ""}`)}`} rel="noopener" className="inline-flex shrink-0 items-center rounded-full border border-[#1f8f4e]/30 bg-[#e8f5ed] px-4 py-2 text-sm font-semibold text-[#14653a]">{l.whatsapp}</a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={dialog} onClose={() => setOpen(null)} className="m-auto w-[min(100vw-1rem,64rem)] rounded-panel bg-ink p-0 text-white backdrop:bg-ink/80">
        {open && (
          <div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="font-semibold">{title(open)}</p>
              <button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-white/30 px-4 py-1.5 text-sm">{l.close}</button>
            </div>
            <ul className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:thin]">
              {open.photos.map((p, i) => (
                <li key={p} className="w-full shrink-0 snap-center">
                  <Image unoptimized src={p} alt={`${title(open)} ${i + 1}/${open.photos.length}`} width={1600} height={1200} sizes="(min-width: 1024px) 1024px, 100vw" className="max-h-[75dvh] w-full object-contain" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </dialog>
    </div>
  );
}
