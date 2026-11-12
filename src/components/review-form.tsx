"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

/** Star rating + text; posts to /api/v1/reviews. The review is held for approval before it is shown. */
export function ReviewForm({ token, locale, defaultName, defaultCountry }: { token: string; locale: string; defaultName: string; defaultCountry: string }) {
  const t = useTranslations("review");
  const [rating, setRating] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!rating) { setMsg(t("error")); setState("error"); return; }
    setState("sending");
    const res = await fetch("/api/v1/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, rating, text: f.get("text"), name: f.get("name"), country: f.get("country"), locale, website: f.get("website") }),
    }).catch(() => null);
    if (res?.ok) { setState("done"); return; }
    const code = res ? (await res.json().catch(() => null))?.error?.code : null;
    setMsg(code === "DONE" ? t("done") : code === "EARLY" ? t("early") : t("error"));
    setState("error");
  }

  if (state === "done") {
    return (
      <div role="status" className="mt-8 rounded-panel bg-paper p-8 text-center">
        <p className="text-2xl font-extrabold">{t("thanks")}</p>
        <p className="mt-2 text-ink-soft">{t("thanksText")}</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-panel bg-paper p-6" noValidate>
      <fieldset>
        <legend className="label">{t("rating")}</legend>
        <div className="flex gap-1" role="radiogroup" aria-label={t("rating")}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t("star", { n })}
              onClick={() => setRating(n)}
              className={`grid size-12 place-items-center rounded-full text-3xl transition-colors ${n <= rating ? "text-gold" : "text-ink/20 hover:text-gold/60"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="r-text" className="label">{t("text")}</label>
        <textarea id="r-text" name="text" required minLength={20} maxLength={1500} rows={6} className="field" aria-describedby="r-text-hint" />
        <p id="r-text-hint" className="mt-1 text-sm text-ink-soft">{t("textHint")}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="r-name" className="label">{t("name")}</label>
          <input id="r-name" name="name" required minLength={2} maxLength={40} defaultValue={defaultName} placeholder={t("nameHint")} className="field" />
        </div>
        <div>
          <label htmlFor="r-country" className="label">{t("country")}</label>
          <input id="r-country" name="country" maxLength={40} defaultValue={defaultCountry} className="field" />
        </div>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {state === "error" && msg && <p role="alert" className="text-sm font-medium text-alert">{msg}</p>}
      <button className="btn-primary w-full sm:w-auto" disabled={state === "sending"}>{state === "sending" ? t("sending") : t("submit")}</button>
    </form>
  );
}
