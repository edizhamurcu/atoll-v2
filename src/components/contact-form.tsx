"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CONTACT_TOPICS } from "@/content/contact-topics";

export function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [topic, setTopic] = useState("");
  const [topicError, setTopicError] = useState(false);
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
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (!topic) {
      setTopicError(true);
      form.querySelector<HTMLSelectElement>("#c-subject")?.focus();
      return;
    }
    setState("sending");
    const res = await fetch("/api/v1/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: f.get("name"), email: f.get("email"), topic, message: f.get("message") || undefined, website: f.get("website") || undefined, challenge: chal?.token, answer, locale }),
    }).catch(() => null);
    if (res?.ok) {
      setState("sent");
      form.reset();
      setTopic("");
      setChalWrong(false);
      newChallenge();
      return;
    }
    const code = res ? ((await res.json().catch(() => null)) as { error?: { code?: string } } | null)?.error?.code ?? "" : "";
    if (code.startsWith("CHALLENGE_")) {
      setState("idle");
      setChalWrong(true);
      newChallenge();
      form.querySelector<HTMLInputElement>("#c-answer")?.focus();
    } else setState("error");
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-name">{t("name")} *</label><input id="c-name" name="name" required maxLength={120} autoComplete="name" placeholder={t("namePh")} className="field" /></div>
        <div><label className="label" htmlFor="c-email">{t("email")} *</label><input id="c-email" name="email" type="email" required autoComplete="email" placeholder={t("emailPh")} className="field" /></div>
      </div>
      <div>
        <label className="label" htmlFor="c-subject">{t("subject")} *</label>
        <select id="c-subject" value={topic} required aria-invalid={topicError || undefined} aria-describedby={topicError ? "c-subject-err" : undefined}
          onChange={(e) => { setTopic(e.target.value); setTopicError(false); }} className="field">
          <option value="" disabled>{t("subjectNone")}</option>
          {CONTACT_TOPICS.map((k) => <option key={k} value={k}>{t(`topics.${k}`)}</option>)}
        </select>
        {topicError && <p id="c-subject-err" role="alert" className="mt-1 text-sm font-medium text-alert">{t("subjectRequired")}</p>}
      </div>
      <div><label className="label" htmlFor="c-message">{t("message")}</label><textarea id="c-message" name="message" rows={5} maxLength={5000} placeholder={t(`topicHints.${topic || "none"}` as "topicHints.none")} className="field" /></div>
      <div className="hidden" aria-hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <fieldset className="rounded-xl border border-ink/15 p-4">
        <legend className="px-1 text-sm font-semibold">{t("challengeTitle")}</legend>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0">
            <label className="label" htmlFor="c-answer">{chal ? t("challengeQ", { a: chal.a, b: chal.b }) : t("challengeLoading")} *</label>
            <input id="c-answer" value={answer} onChange={(e) => { setAnswer(e.target.value.replace(/\D/g, "").slice(0, 2)); setChalWrong(false); }}
              required inputMode="numeric" pattern="[0-9]{1,2}" maxLength={2} autoComplete="off" disabled={!chal}
              aria-invalid={chalWrong || undefined} aria-describedby={chalWrong ? "c-answer-err" : undefined} className="field w-24" />
          </div>
          <button type="button" onClick={newChallenge} className="pb-3 text-sm font-medium text-aegean underline-offset-2 hover:underline">{t("challengeNew")}</button>
        </div>
        {chalWrong && <p id="c-answer-err" role="alert" className="mt-2 text-sm font-medium text-alert">{t("challengeWrong")}</p>}
      </fieldset>
      <button className="btn-primary" disabled={state === "sending" || !chal}>{state === "sending" ? t("sending") : t("send")}</button>
      {state === "sent" && <p role="status" className="font-medium text-aegean">{t("sent")}</p>}
      {state === "error" && <p role="alert" className="font-medium text-alert">{t("error")}</p>}
    </form>
  );
}
