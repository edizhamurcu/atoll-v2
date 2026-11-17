import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatQueueNo, parseQueueNo, SERVICE_STATUSES, type ServiceKindKey, type ServiceStatusKey } from "@/content/service";
import { trackServiceRequest } from "@/server/service-requests";

export async function generateMetadata({ params }: PageProps<"/[locale]/service/[no]">): Promise<Metadata> {
  await connection();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "service" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

export default function ServiceTrackPage({ params }: PageProps<"/[locale]/service/[no]">) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-panel bg-paper" />}>
        <Inner params={params} />
      </Suspense>
    </div>
  );
}

async function Inner({ params }: { params: PageProps<"/[locale]/service/[no]">["params"] }) {
  const { locale, no } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "service" });
  const n = parseQueueNo(decodeURIComponent(no));
  const r = n === null ? null : await trackServiceRequest(n);
  const dt = (d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Famagusta" }).format(d);
  if (!r)
    return (
      <div className="rounded-panel bg-paper p-8 text-center">
        <p className="text-lg font-semibold">{t("notFound")}</p>
        <Link href="/car-sales#after" className="btn-primary mt-6">{t("back")}</Link>
      </div>
    );
  const status = r.status as ServiceStatusKey;
  const step = status === "CANCELLED" ? -1 : SERVICE_STATUSES.filter((s) => s !== "CANCELLED").indexOf(status);
  const flow = SERVICE_STATUSES.filter((s) => s !== "CANCELLED");
  return (
    <>
      <h1 className="text-4xl font-extrabold">{t("pageTitle", { no: formatQueueNo(r.queueNo) })}</h1>
      <div className="mt-6 rounded-panel bg-ink p-6 text-white">
        <p className="text-sm text-white/70">{t("status")}</p>
        <p className="mt-1 text-3xl font-extrabold text-gold">{t(`statuses.${status}`)}</p>
        <p className="mt-2 text-white/85">{t(`statusText.${status}`)}</p>
        {step >= 0 && (
          <ol aria-hidden className="mt-5 grid grid-cols-5 gap-1.5">
            {flow.map((s, i) => <li key={s} className={`h-2 rounded-full ${i <= step ? "bg-gold" : "bg-white/20"}`} />)}
          </ol>
        )}
      </div>
      {r.publicNote && (
        <div className="mt-4 rounded-2xl border border-gold/60 bg-paper p-5">
          <p className="text-sm font-semibold text-ink-soft">{t("note")}</p>
          <p className="mt-1 whitespace-pre-line">{r.publicNote}</p>
        </div>
      )}
      <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <div><dt className="text-sm text-ink-soft">{t("vehicle")}</dt><dd className="font-semibold">{r.vehicleMake}</dd></div>
        <div><dt className="text-sm text-ink-soft">{t("services")}</dt><dd className="font-semibold">{r.services.map((k) => t(`kinds.${k as ServiceKindKey}`)).join(", ")}</dd></div>
        <div><dt className="text-sm text-ink-soft">{t("received")}</dt><dd>{dt(r.createdAt)}</dd></div>
        <div><dt className="text-sm text-ink-soft">{t("updated")}</dt><dd>{dt(r.updatedAt)}</dd></div>
      </dl>
      <Link href="/car-sales#after" className="btn-quiet mt-8">{t("back")}</Link>
    </>
  );
}
