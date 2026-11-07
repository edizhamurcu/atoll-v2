import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { WHATSAPP, PHONE, EMAIL } from "@/lib/contact";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const [n, f, b] = await Promise.all([getTranslations("nav"), getTranslations("footer"), getTranslations("booking")]);
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <h1 className="text-4xl font-extrabold md:text-5xl">{n("contact")}</h1>
      <p className="mt-6 text-lg">{f("address")}</p>
      <p className="mt-2 text-ink-soft">{f("hours")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a className="btn-primary" href={`https://wa.me/${WHATSAPP.replace(/\D/g, "")}`} rel="noopener">{b("whatsapp")}</a>
        <a className="btn-quiet" href={`tel:${PHONE.replace(/\s/g, "")}`}>{PHONE}</a>
        <a className="btn-quiet" href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </div>
    </div>
  );
}
