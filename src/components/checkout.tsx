"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

const noop = () => () => {};
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { money } from "@/lib/search-params";
import { WHATSAPP } from "@/lib/contact";

type Booking = {
  ref: string; status: string; paymentMode: string; holdExpiresAt: string | null; days: number;
  vehicle: { name: string; image: string | null };
  pickup: { at: string; location: string }; return: { at: string; location: string }; deliveryZone: string | null;
  totals: { grandTotal: string; deposit: string };
  depositAvailable: boolean;
  extras: { name: string; quantity: number; total: string }[];
  customer: { firstName: string } | null;
};

export function Checkout({ refCode }: { refCode: string }) {
  const t = useTranslations("booking");
  const tn = useTranslations("nav");
  const locale = useLocale();
  const params = useSearchParams();
  const [res, setRes] = useState<{ key: string; data: Booking | null } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageKey = `atoll:${refCode}`;
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const stored = useSyncExternalStore(noop, () => sessionStorage.getItem(storageKey), () => null);
  const urlToken = params.get("t");
  const token = urlToken ?? stored;

  useEffect(() => {
    if (urlToken) sessionStorage.setItem(storageKey, urlToken);
  }, [urlToken, storageKey]);

  const reqKey = `${token}|${nonce}`;
  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch(`/api/v1/bookings/${encodeURIComponent(refCode)}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setRes({ key: reqKey, data: d }), () => alive && setRes({ key: reqKey, data: null }));
    return () => {
      alive = false;
    };
  }, [reqKey, token, refCode]);

  const booking = res?.data ?? null;
  const loaded = res !== null;
  const load = async () => setNonce((n) => n + 1);

  useEffect(() => {
    if (booking?.status !== "HOLD") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [booking?.status]);
  const left = booking?.holdExpiresAt ? Math.max(0, Math.floor((new Date(booking.holdExpiresAt).getTime() - now) / 1000)) : 0;
  const missing = (hydrated && !token) || (loaded && !booking);

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim() || undefined;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/bookings/${encodeURIComponent(refCode)}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paymentMode: f.get("pay") === "deposit" ? "deposit" : "pay_on_pickup",
          acceptTerms: f.get("terms") === "on",
          customer: { firstName: get("firstName"), lastName: get("lastName"), email: get("email"), phone: get("phone"), country: get("country"), licenseNumber: get("license"), flightNumber: get("flight"), deliveryAddress: get("address"), notes: get("notes") },
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.details?.[0]?.message ?? body?.error?.message ?? "error");
      if (body.checkoutUrl) {
        window.location.href = body.checkoutUrl;
        return;
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (missing) return <p className="rounded-2xl bg-paper p-6">{t("notFound")}</p>;
  if (!booking) return <div className="h-64 animate-pulse rounded-2xl bg-stone-deep" />;
  const b = booking;

  const dt = (s: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Famagusta" }).format(new Date(s));
  const wa = `https://wa.me/${WHATSAPP.replace(/\D/g, "")}?text=${encodeURIComponent(`Atoll ${b.ref}`)}`;
  const summary = (
    <section className="rounded-[var(--radius-panel)] bg-paper p-5">
      <p className="text-sm text-ink-soft">{b.ref}</p>
      <h2 className="text-2xl font-bold">{b.vehicle.name}</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div><dt className="text-ink-soft">{b.pickup.location}</dt><dd className="font-medium">{dt(b.pickup.at)}</dd></div>
        <div><dt className="text-ink-soft">{b.return.location}</dt><dd className="font-medium">{dt(b.return.at)}</dd></div>
        {b.deliveryZone && <div><dt className="text-ink-soft">{t("address")}</dt><dd>{b.deliveryZone}</dd></div>}
        {b.extras.map((x) => (
          <div key={x.name} className="flex justify-between"><dt>{x.name} ×{x.quantity}</dt><dd>{money(x.total, locale)}</dd></div>
        ))}
        <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-bold"><dt>{t("total")}</dt><dd>{money(b.totals.grandTotal, locale)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-soft">{t("deposit")}</dt><dd>{money(b.totals.deposit, locale)}</dd></div>
      </dl>
    </section>
  );

  if (b.status === "CONFIRMED" || b.status === "PENDING_PAYMENT") {
    const done = b.status === "CONFIRMED";
    return (
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h1 className="text-4xl font-extrabold">{done ? t("confirmedTitle") : t("pendingTitle")}</h1>
          <p className="mt-4 max-w-prose text-lg text-ink-soft">{done ? t("confirmedLead", { ref: b.ref }) : t("pendingLead", { ref: b.ref })}</p>
          <a href={wa} className="btn-quiet mt-6" rel="noopener">{t("whatsapp")}</a>
        </div>
        {summary}
      </div>
    );
  }
  if (b.status !== "HOLD" || left === 0) {
    return (
      <div className="rounded-2xl bg-paper p-6">
        <p>{t("expired")}</p>
        <Link href="/cars" className="btn-primary mt-4">{tn("book")}</Link>
      </div>
    );
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <form onSubmit={confirm} className="space-y-5" noValidate>
        <p className="rounded-full bg-aegean-wash px-4 py-2 text-sm font-medium" aria-live="polite">
          {t("held", { minutes: 15 })}: <span className="tabular-nums">{mm}:{ss}</span>
        </p>
        <h1 className="text-3xl font-extrabold">{t("details")}</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <F name="firstName" label={t("firstName")} required autoComplete="given-name" />
          <F name="lastName" label={t("lastName")} required autoComplete="family-name" />
          <F name="email" label={t("email")} type="email" required autoComplete="email" />
          <F name="phone" label={t("phone")} type="tel" required autoComplete="tel" />
          <F name="country" label={t("country")} autoComplete="country-name" />
          <F name="license" label={t("license")} />
          <F name="flight" label={t("flight")} />
          {b.deliveryZone && <F name="address" label={t("address")} required />}
        </div>
        <div>
          <label className="label" htmlFor="notes">{t("notes")}</label>
          <textarea id="notes" name="notes" rows={3} className="field" maxLength={1000} />
        </div>
        {b.depositAvailable ? (
        <fieldset className="space-y-2">
          <label className="flex items-center gap-3 rounded-xl border border-ink/10 p-3">
            <input type="radio" name="pay" value="deposit" defaultChecked className="accent-[var(--color-bougain)]" />
            <span>{t("payDeposit")} <span className="text-ink-soft">({money(b.totals.deposit, locale)})</span></span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-ink/10 p-3">
            <input type="radio" name="pay" value="pay_on_pickup" className="accent-[var(--color-bougain)]" />
            <span>{t("payOnPickup")}</span>
          </label>
        </fieldset>
        ) : (
          <input type="hidden" name="pay" value="pay_on_pickup" />
        )}
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="terms" required className="mt-0.5 size-4 accent-[var(--color-aegean)]" />
          <span>
            {t("terms")} (<Link href="/rental-terms" className="underline" target="_blank">↗</Link>)
          </span>
        </label>
        {error && <p role="alert" className="text-sm font-medium text-alert">{error}</p>}
        <button className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? t("confirming") : b.depositAvailable ? t("payDeposit") : t("payOnPickup")}</button>
      </form>
      {summary}
    </div>
  );
}

function F({ name, label, ...rest }: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}{rest.required ? " *" : ""}</label>
      <input id={name} name={name} className="field" {...rest} />
    </div>
  );
}
