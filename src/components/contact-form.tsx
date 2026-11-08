"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setState("sending");
    const res = await fetch("/api/v1/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: f.get("name"), email: f.get("email"), subject: f.get("subject") || undefined, message: f.get("message") || undefined, website: f.get("website") || undefined, locale }),
    }).catch(() => null);
    if (res?.ok) {
      setState("sent");
      form.reset();
    } else setState("error");
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-name">{t("name")} *</label><input id="c-name" name="name" required maxLength={120} autoComplete="name" className="field" /></div>
        <div><label className="label" htmlFor="c-email">{t("email")} *</label><input id="c-email" name="email" type="email" required autoComplete="email" className="field" /></div>
      </div>
      <div><label className="label" htmlFor="c-subject">{t("subject")}</label><input id="c-subject" name="subject" maxLength={200} className="field" /></div>
      <div><label className="label" htmlFor="c-message">{t("message")}</label><textarea id="c-message" name="message" rows={5} maxLength={5000} className="field" /></div>
      <div className="hidden" aria-hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button className="btn-primary" disabled={state === "sending"}>{state === "sending" ? t("sending") : t("send")}</button>
      {state === "sent" && <p role="status" className="font-medium text-aegean">{t("sent")}</p>}
      {state === "error" && <p role="alert" className="font-medium text-alert">{t("error")}</p>}
    </form>
  );
}
