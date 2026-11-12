"use client";
import { useTranslations } from "next-intl";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { PHONE, WHATSAPP } from "@/lib/contact";

/** Shown when a server component fails (e.g. database unreachable). Keeps a way to reach Atoll. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  const b = useTranslations("booking");
  const h = useTranslations("home");
  return (
    <div className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="text-3xl font-extrabold">{t("generic")}</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-ink" onClick={reset}>{t("retry")}</button>
        <a className="btn-quiet" href={`tel:${PHONE.replace(/\s/g, "")}`}>{h("ctaCall", { phone: PHONE })}</a>
        <a className="btn-wa" href={`https://wa.me/${WHATSAPP.replace(/\D/g, "")}`} target="_blank" rel="noopener"><WhatsAppIcon />{b("whatsapp")}</a>
      </div>
    </div>
  );
}
