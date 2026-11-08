"use client";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { money, queryToState } from "@/lib/search-params";

type Extra = { code: string; name: string; pricing: "PER_DAY" | "PER_RENTAL"; price: string; maxQty: number };
type Quote = { days: number; rentalTotal: string; discountTotal: string; extrasTotal: string; feesTotal: string; grandTotal: string; depositAmount: string; payOnPickup: string; lines: { kind: string; code: string; total: string }[] };

export function BookingPanel({ slug, extras }: { slug: string; extras: Extra[] }) {
  const t = useTranslations("booking");
  const tr = useTranslations("results");
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const state = queryToState(params);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [avail, setAvail] = useState<{ available: boolean; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selected = useMemo(() => Object.entries(qty).filter(([, n]) => n > 0).map(([code, quantity]) => ({ code, quantity })), [qty]);
  const base = state && {
    modelSlug: slug,
    pickupAt: params.get("pickupAt"),
    returnAt: params.get("returnAt"),
    pickupLocation: state.pickupLocation,
    returnLocation: state.returnLocation,
    deliveryZone: state.deliveryZone,
  };
  const key = JSON.stringify([base, selected]);

  useEffect(() => {
    if (!base) return;
    const ctl = new AbortController();
    const id = setTimeout(async () => {
      try {
        setError(null);
        const res = await fetch("/api/v1/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...base, extras: selected, locale }), signal: ctl.signal });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? "error");
        setQuote(body.quote);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      }
    }, 200);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!state) return;
    fetch(`/api/v1/availability?${params.toString()}&locale=${locale}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const r = d?.results?.find((x: { slug: string }) => x.slug === slug);
        if (r) setAvail(r.availability);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString(), slug]);

  async function reserve() {
    if (!base) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ ...base, extras: selected, locale }),
      });
      const body = await res.json();
      if (res.status === 409 && body?.error?.code === "SOLD_OUT") {
        setAvail({ available: false, count: 0 });
        throw new Error(t("soldOut"));
      }
      if (!res.ok) throw new Error(body?.error?.message ?? "error");
      sessionStorage.setItem(`atoll:${body.ref}`, body.token);
      router.push(`/booking/${body.ref}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (!state) return null;
  const soldOut = avail && !avail.available;
  return (
    <div className="space-y-6">
      {avail && (
        <p className={`font-semibold ${soldOut ? "text-alert" : "text-bougain"}`}>
          {soldOut ? tr("soldOut") : tr("available", { count: avail.count })}
        </p>
      )}
      {extras.length > 0 && (
        <fieldset>
          <legend className="font-display text-lg font-bold">{t("extras")}</legend>
          <ul className="mt-3 divide-y divide-ink/8">
            {extras.map((x) => (
              <li key={x.code}>
                <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2.5">
                <span>
                  <span className="block">{x.name}</span>
                  <span className="text-sm text-ink-soft">{money(x.price, locale)} {x.pricing === "PER_DAY" ? t("perDay") : t("perRental")}</span>
                </span>
                {x.maxQty > 1 ? (
                  <select aria-label={x.name} className="field !w-20" value={qty[x.code] ?? 0} onChange={(e) => setQty({ ...qty, [x.code]: Number(e.target.value) })}>
                    {Array.from({ length: x.maxQty + 1 }, (_, i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                ) : (
                  <input type="checkbox" aria-label={x.name} className="size-6 accent-[var(--color-aegean)]" checked={(qty[x.code] ?? 0) > 0} onChange={(e) => setQty({ ...qty, [x.code]: e.target.checked ? 1 : 0 })} />
                )}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      {quote && (
        <section aria-labelledby="sum" className="rounded-2xl bg-stone p-4">
          <h3 id="sum" className="text-lg font-bold">{t("summary")}</h3>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label={t("rental", { days: quote.days })} value={money(quote.rentalTotal, locale)} />
            {Number(quote.discountTotal) > 0 && <Row label={t("discount")} value={`−${money(quote.discountTotal, locale)}`} />}
            {Number(quote.extrasTotal) > 0 && <Row label={t("extras")} value={money(quote.extrasTotal, locale)} />}
            {Number(quote.feesTotal) > 0 && <Row label={t("fees")} value={money(quote.feesTotal, locale)} />}
            <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-bold">
              <dt>{t("total")}</dt>
              <dd>{money(quote.grandTotal, locale)}</dd>
            </div>
            <Row label={t("deposit")} value={money(quote.depositAmount, locale)} />
            <Row label={t("onPickup")} value={money(quote.payOnPickup, locale)} />
          </dl>
        </section>
      )}
      {error && <p role="alert" className="text-sm font-medium text-alert">{error}</p>}
      <button className="btn-primary w-full" disabled={busy || !quote || Boolean(soldOut)} onClick={reserve}>
        {busy ? t("reserving") : t("reserve")}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
