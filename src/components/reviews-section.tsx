import { getTranslations } from "next-intl/server";
import { approvedReviews } from "@/server/reviews";
import { fmtDate } from "@/content/blog";

const Stars = ({ n, label }: { n: number; label: string }) => (
  <span role="img" aria-label={label} className="tracking-tight text-gold">
    {"★".repeat(Math.round(n))}<span className="text-ink/15">{"★".repeat(5 - Math.round(n))}</span>
  </span>
);

/**
 * Approved customer reviews (all, or one car model). Renders nothing until there is at least one, so pages
 * never show an empty or invented block. Self-collected reviews: no rating rich-result markup (Google policy).
 */
export async function ReviewsSection({ locale, modelSlug, className = "" }: { locale: string; modelSlug?: string; className?: string }) {
  const { count, average, reviews } = await approvedReviews({ modelSlug, take: modelSlug ? 4 : 6 });
  if (!count) return null;
  const t = await getTranslations({ locale, namespace: "review" });
  const avg = average.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <section aria-labelledby="reviews" data-reveal className={className}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews" className="text-3xl font-extrabold">{modelSlug ? t("modelTitle") : t("sectionTitle")}</h2>
        <p className="flex items-center gap-2 text-ink-soft">
          <Stars n={average} label={t("star", { n: avg })} /> {t("basedOn", { average: avg, count })}
        </p>
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.id} className="flex flex-col rounded-panel bg-paper p-5">
            <Stars n={r.rating} label={t("star", { n: r.rating })} />
            <blockquote className="mt-3 flex-1 whitespace-pre-line leading-relaxed">{r.text}</blockquote>
            <p className="mt-4 text-sm">
              <span className="font-semibold">{r.name}</span>
              {r.country && <span className="text-ink-soft">, {r.country}</span>}
            </p>
            <p className="text-xs text-ink-soft">
              {t("verified")} · {r.model} · <time dateTime={r.createdAt.toISOString()}>{fmtDate(r.createdAt.toISOString().slice(0, 10), locale)}</time>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
