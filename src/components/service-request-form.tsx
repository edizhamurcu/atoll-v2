"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { parseQueueNo, SERVICE_KINDS, type ServiceKindKey } from "@/content/service";

type Done = { queueNo: number; number: string; emailed: boolean };

/** OSK after-sales: online service request. Returns a queue number the customer tracks on /service/<no>. */
export function ServiceRequestForm() {
  const t = useTranslations("service");
  const tc = useTranslations("contact");
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [errorKey, setErrorKey] = useState<"error" | "noLinks" | "phoneInvalid">("error");
  const [kinds, setKinds] = useState<ServiceKindKey[]>([]);
  const [kindsError, setKindsError] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [chal, setChal] = useState<{ a: number; b: number; token: string } | null>(null);
  const [answer, setAnswer] = useState("");
  const [chalWrong, setChalWrong] = useState(false);
  const loadChallenge = useCallback(() => {
    fetch("/api/v1/contact/challenge", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setChal(c))
      .catch(() => setChal(null));
  }, []);
  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);
  const newChallenge = () => {
    setAnswer("");
    loadChallenge();
  };
  const toggle = (k: ServiceKindKey) => {
    setKindsError(false);
    setKinds((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (!kinds.length) {
      setKindsError(true);
      form.querySelector<HTMLInputElement>("#sv-kinds input")?.focus();
      return;
    }
    setState("sending");
    const email = String(f.get("email") ?? "").trim();
    const res = await fetch("/api/v1/service-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: f.get("name"), phone: f.get("phone"), email: email || undefined, vehicleMake: f.get("make"), vehiclePlate: f.get("plate"),
        vehicleYear: f.get("year") ? Number(f.get("year")) : undefined, boughtFromOsk: f.get("osk") === "on", services: kinds,
        details: String(f.get("details") ?? "").trim() || undefined, preferredDate: f.get("preferred") || undefined,
        website: f.get("website") || undefined, challenge: chal?.token, answer, locale,
      }),
    }).catch(() => null);
    if (res?.ok) {
      const j = (await res.json()) as { queueNo: number; number: string };
      setDone({ queueNo: j.queueNo, number: j.number, emailed: Boolean(email) });
      setState("idle");
      return;
    }
    const body = res ? ((await res.json().catch(() => null)) as { error?: { code?: string; details?: { path: string }[] } } | null) : null;
    const code = body?.error?.code ?? "";
    if (code.startsWith("CHALLENGE_")) {
      setState("idle");
      setChalWrong(true);
      newChallenge();
      form.querySelector<HTMLInputElement>("#sv-answer")?.focus();
      return;
    }
    setErrorKey(code === "NO_LINKS" ? "noLinks" : body?.error?.details?.some((d) => d.path === "phone") ? "phoneInvalid" : "error");
    setState("error");
    newChallenge();
  }

  if (done)
    return (
      <div role="status" className="rounded-[var(--radius-panel)] bg-ink p-7 text-white">
        <h3 className="text-2xl font-extrabold">{t("doneTitle")}</h3>
        <p className="mt-4 text-sm text-white/75">{t("doneNumber")}</p>
        <p className="mt-1 break-all text-5xl font-extrabold tracking-tight text-gold">{done.number}</p>
        <p className="mt-4 max-w-prose text-white/85">{t("doneText")}</p>
        {done.emailed && <p className="mt-2 text-sm text-white/75">{t("doneEmail")}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/service/${done.queueNo}`} className="btn-primary">{t("doneTrack")}</Link>
          <button type="button" onClick={() => { setDone(null); setKinds([]); newChallenge(); }} className="btn-quiet">{t("another")}</button>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[var(--radius-panel)] bg-paper p-5 sm:p-7">
      <h3 className="text-2xl font-bold">{t("formTitle")}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="sv-name">{t("name")} *</label><input id="sv-name" name="name" required minLength={2} maxLength={120} autoComplete="name" className="field" /></div>
        <div><label className="label" htmlFor="sv-phone">{t("phone")} *</label><input id="sv-phone" name="phone" type="tel" required minLength={6} maxLength={30} autoComplete="tel" inputMode="tel" className="field" /></div>
      </div>
      <div>
        <label className="label" htmlFor="sv-email">{t("email")}</label>
        <input id="sv-email" name="email" type="email" maxLength={200} autoComplete="email" aria-describedby="sv-email-hint" className="field" />
        <p id="sv-email-hint" className="mt-1 text-sm text-ink-soft">{t("emailHint")}</p>
      </div>

      <fieldset className="rounded-xl border border-ink/15 p-4">
        <legend className="px-1 text-sm font-semibold">{t("vehicleLegend")}</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1"><label className="label" htmlFor="sv-make">{t("make")} *</label><input id="sv-make" name="make" required minLength={2} maxLength={120} className="field" /></div>
          <div><label className="label" htmlFor="sv-plate">{t("plate")} *</label><input id="sv-plate" name="plate" required minLength={2} maxLength={20} autoCapitalize="characters" className="field uppercase" /></div>
          <div><label className="label" htmlFor="sv-year">{t("year")}</label><input id="sv-year" name="year" type="number" inputMode="numeric" min={1950} max={2100} className="field" /></div>
        </div>
        <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" name="osk" className="mt-1 size-5 shrink-0" />{t("boughtOsk")}</label>
      </fieldset>

      <fieldset id="sv-kinds" aria-describedby={kindsError ? "sv-kinds-err" : undefined}>
        <legend className="label">{t("servicesLegend")} *</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {SERVICE_KINDS.map((k) => (
            <label key={k} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${kinds.includes(k) ? "border-ink bg-white font-semibold" : "border-ink/15 bg-white/60"}`}>
              <input type="checkbox" checked={kinds.includes(k)} onChange={() => toggle(k)} className="size-5 shrink-0" />
              {t(`kinds.${k}`)}
            </label>
          ))}
        </div>
        {kindsError && <p id="sv-kinds-err" role="alert" className="mt-2 text-sm font-medium text-alert">{t("servicesRequired")}</p>}
      </fieldset>

      <div><label className="label" htmlFor="sv-details">{t("details")}</label><textarea id="sv-details" name="details" rows={4} maxLength={3000} placeholder={t("detailsPh")} className="field" /></div>
      <div className="sm:max-w-xs"><label className="label" htmlFor="sv-preferred">{t("preferred")}</label><input id="sv-preferred" name="preferred" type="date" className="field" /></div>
      <div className="hidden" aria-hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <fieldset className="rounded-xl border border-ink/15 bg-white/60 p-4">
        <legend className="px-1 text-sm font-semibold">{tc("challengeTitle")}</legend>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0">
            <label className="label" htmlFor="sv-answer">{chal ? tc("challengeQ", { a: chal.a, b: chal.b }) : tc("challengeLoading")} *</label>
            <input id="sv-answer" value={answer} onChange={(e) => { setAnswer(e.target.value.replace(/\D/g, "").slice(0, 2)); setChalWrong(false); }}
              required inputMode="numeric" pattern="[0-9]{1,2}" maxLength={2} autoComplete="off" disabled={!chal}
              aria-invalid={chalWrong || undefined} aria-describedby={chalWrong ? "sv-answer-err" : undefined} className="field w-24" />
          </div>
          <button type="button" onClick={newChallenge} className="pb-3 text-sm font-medium text-aegean underline-offset-2 hover:underline">{tc("challengeNew")}</button>
        </div>
        {chalWrong && <p id="sv-answer-err" role="alert" className="mt-2 text-sm font-medium text-alert">{tc("challengeWrong")}</p>}
      </fieldset>

      <button className="btn-primary w-full sm:w-auto" disabled={state === "sending" || !chal}>{state === "sending" ? t("sending") : t("send")}</button>
      {state === "error" && <p role="alert" className="font-medium text-alert">{t(errorKey)}</p>}
    </form>
  );
}

/** "Follow your request" box: queue number -> /service/<no>. */
export function ServiceTrackForm() {
  const t = useTranslations("service");
  const router = useRouter();
  const [bad, setBad] = useState(false);
  return (
    <form
      className="rounded-[var(--radius-panel)] border border-ink/10 p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        const n = parseQueueNo(String(new FormData(e.currentTarget).get("no") ?? ""));
        if (n === null) return setBad(true);
        router.push(`/service/${n}`);
      }}
    >
      <h3 className="text-xl font-bold">{t("trackTitle")}</h3>
      <p className="mt-1 text-ink-soft">{t("trackLead")}</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 grow sm:max-w-xs">
          <label className="label" htmlFor="sv-no">{t("trackLabel")}</label>
          <input id="sv-no" name="no" placeholder={t("trackPh")} autoComplete="off" required aria-invalid={bad || undefined} aria-describedby={bad ? "sv-no-err" : undefined} onChange={() => setBad(false)} className="field" />
        </div>
        <button className="btn-ink">{t("trackBtn")}</button>
      </div>
      {bad && <p id="sv-no-err" role="alert" className="mt-2 text-sm font-medium text-alert">{t("trackInvalid")}</p>}
    </form>
  );
}
