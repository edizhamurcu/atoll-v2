import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { parseReviewToken, reviewTarget } from "@/server/reviews";
import { ReviewForm } from "@/components/review-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/review/[token]">): Promise<Metadata> {
  await connection();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "review" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

export default function ReviewPage({ params }: PageProps<"/[locale]/review/[token]">) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-panel bg-paper" />}>
        <Inner params={params} />
      </Suspense>
    </div>
  );
}

async function Inner({ params }: { params: PageProps<"/[locale]/review/[token]">["params"] }) {
  const { locale, token } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "review" });
  const ref = parseReviewToken(decodeURIComponent(token));
  const target = ref ? await reviewTarget(ref) : { state: "invalid" as const };
  if (target.state !== "open") {
    return (
      <div className="rounded-panel bg-paper p-8 text-center">
        <p className="text-lg font-semibold">{t(target.state)}</p>
        <Link href="/" className="btn-primary mt-6">{t("home")}</Link>
      </div>
    );
  }
  const b = target.booking;
  const car = `${b.model.make} ${b.model.model}`;
  const suggested = b.customer ? `${b.customer.firstName} ${b.customer.lastName.slice(0, 1)}.`.trim() : "";
  return (
    <>
      <h1 className="text-4xl font-extrabold">{t("title")}</h1>
      <p className="mt-3 text-lg text-ink-soft">{t("lead", { car })}</p>
      <ReviewForm token={decodeURIComponent(token)} locale={locale} defaultName={suggested} defaultCountry={b.customer?.country ?? ""} />
    </>
  );
}
