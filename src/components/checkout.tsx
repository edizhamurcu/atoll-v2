"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

const noop = () => () => {};
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { money } from "@/lib/search-params";
import { PHONE, WHATSAPP } from "@/lib/contact";
import { NOTE_TOPICS } from "@/content/booking-notes";
import { Turnstile } from "./turnstile";

type Booking = {
  ref: string; status: string; paymentMode: string; holdExpiresAt: string | null; days: number;
  vehicle: { name: string; image: string | null };
  pickup: { at: string; location: string }; return: { at: string; location: string }; deliveryZone: string | null;
  totals: { grandTotal: string; deposit: string };
  depositAvailable: boolean;
  extras: { name: string; quantity: number; total: string }[];
  customer: { firstName: string } | null;
};

export function Checkout({ refCode, turnstileSiteKey }: { refCode: string; turnstileSiteKey?: string }) {
  const t = useTranslations("booking");
  const tn = useTranslations("nav");
  const th = useTranslations("home");
  const locale = useLocale();
  const params = useSearchParams();
  const [res, setRes] = useState<{ key: string; data: Booking | null } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
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
    if (turnstileSiteKey && !captcha) {
      setError(t("errors.captcha"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/bookings/${encodeURIComponent(refCode)}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paymentMode: f.get("pay") === "deposit" ? "deposit" : "pay_on_pickup",
          acceptTerms: f.get("terms") === "on",
          customer: { firstName: get("firstName"), lastName: get("lastName"), email: get("email"), phone: get("phone"), country: get("country"), licenseNumber: get("license"), flightNumber: get("flight"), deliveryAddress: get("address"), notes: get("notes"), notesTopic: topic || undefined },
          website: String(f.get("website") ?? ""),
          captchaToken: captcha ?? undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(errorKey(res.status, body?.error));
      if (body.checkoutUrl) {
        window.location.href = body.checkoutUrl;
        return;
      }
      await load();
    } catch (err) {
      const key = (err as Error).message;
      setError(t.has(`errors.${key}`) ? t(`errors.${key}` as "errors.generic") : t("errors.generic"));
      // Turnstile tokens are single-use and were spent by the server check: start a fresh challenge.
      if (turnstileSiteKey) { setCaptcha(null); setCaptchaKey((k) => k + 1); }
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
        {b.depositAvailable && <div className="flex justify-between"><dt className="text-ink-soft">{t("deposit")}</dt><dd>{money(b.totals.deposit, locale)}</dd></div>}
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
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="btn-quiet">{th("ctaCall", { phone: PHONE })}</a>
            <a href={wa} className="btn-wa" target="_blank" rel="noopener"><WhatsAppIcon />{t("whatsapp")}</a>
          </div>
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
          <F name="firstName" label={t("firstName")} placeholder={t("ph.firstName")} required autoComplete="given-name" maxLength={80} />
          <F name="lastName" label={t("lastName")} placeholder={t("ph.lastName")} required autoComplete="family-name" maxLength={80} />
          <F name="email" label={t("email")} placeholder={t("ph.email")} type="email" required autoComplete="email" maxLength={200} />
          <F name="phone" label={t("phone")} placeholder={t("ph.phone")} type="tel" required autoComplete="tel" maxLength={20} />
          <F name="country" label={t("country")} placeholder={t("ph.country")} autoComplete="country-name" maxLength={60} />
          <F name="license" label={t("license")} placeholder={t("ph.license")} maxLength={40} />
          <F name="flight" label={t("flight")} placeholder={t("ph.flight")} maxLength={12} />
          {b.deliveryZone && <F name="address" label={t("address")} placeholder={t("ph.address")} required maxLength={300} />}
        </div>
        <fieldset className="space-y-3">
          <legend className="label">{t("notes")}</legend>
          <div>
            <label className="sr-only" htmlFor="notesTopic">{t("notesTopic")}</label>
            <select id="notesTopic" value={topic} onChange={(e) => setTopic(e.target.value)} className="field">
              <option value="">{t("notesTopicNone")}</option>
              {NOTE_TOPICS.map((k) => <option key={k} value={k}>{t(`topics.${k}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="sr-only" htmlFor="notes">{t("notesText")}</label>
            <textarea id="notes" name="notes" rows={3} className="field" maxLength={1000} placeholder={t(`topicHints.${topic || "none"}` as "topicHints.none")} />
          </div>
        </fieldset>
        {/* Honeypot: off-screen and skipped by keyboard and screen readers; bots that fill every field get rejected. */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="website">{t("hp")}</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
        {turnstileSiteKey && <Turnstile key={captchaKey} siteKey={turnstileSiteKey} locale={locale} onToken={setCaptcha} />}
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
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" name="terms" required className="mt-0.5 size-5 accent-[var(--color-aegean)]" />
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

/** Map an API error to a message key under booking.errors (messages are localized on the client). */
function errorKey(status: number, err: { code?: string; details?: { path?: string }[] } | undefined): string {
  if (status === 429) return "rate";
  if (err?.code === "SPAM_CHECK") return "spam";
  if (err?.code === "HOLD_EXPIRED") return "expired";
  if (err?.code === "ADDRESS_REQUIRED") return "address";
  const path = err?.details?.[0]?.path ?? "";
  if (path.endsWith("phone")) return "phone";
  if (path.endsWith("email")) return "email";
  if (path.endsWith("firstName") || path.endsWith("lastName")) return "name";
  if (path === "acceptTerms") return "terms";
  return "generic";
}
