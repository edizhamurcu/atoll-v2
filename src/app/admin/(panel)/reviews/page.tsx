import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/server/admin/auth";
import { listReviewsAdmin } from "@/server/reviews";
import { reviewDecisionAction } from "../../actions";
import { dt } from "../../format";

const LABEL = { PENDING: "Onay bekliyor", APPROVED: "Yayında", REJECTED: "Reddedildi" } as const;

export default function ReviewsAdmin() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Yükleniyor…</p>}>
      <Inner />
    </Suspense>
  );
}

async function Inner() {
  await requireAdmin();
  const rows = await listReviewsAdmin();
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-extrabold">Müşteri yorumları</h1>
      <p className="mt-2 text-ink-soft">Yorum bağlantısı rezervasyon sayfasından gönderilir. Yalnız onayladığınız yorumlar sitede görünür; içerik değiştirilmez.</p>
      {rows.length === 0 && <p className="mt-8 rounded-2xl bg-paper p-6 text-ink-soft">Henüz yorum yok.</p>}
      <ul className="mt-6 space-y-4">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl bg-paper p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-lg text-gold">{"★".repeat(r.rating)}<span className="text-ink/15">{"★".repeat(5 - r.rating)}</span></span>
              <span className="rounded-full bg-stone px-3 py-1 font-semibold">{LABEL[r.status]}</span>
            </div>
            <p className="mt-3 whitespace-pre-line">{r.text}</p>
            <p className="mt-3 text-sm text-ink-soft">
              {r.name}{r.country ? `, ${r.country}` : ""} · {r.model.make} {r.model.model} · <Link className="text-aegean" href={`/admin/bookings/${r.booking.ref}`}>{r.booking.ref}</Link> · {dt(r.createdAt)} · {r.locale.toUpperCase()}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["APPROVED", "REJECTED", "PENDING"] as const).filter((s) => s !== r.status).map((s) => (
                <form key={s} action={reviewDecisionAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value={s} />
                  <button className={`${s === "APPROVED" ? "btn-ink" : "btn-quiet"} !py-2 text-sm`}>{s === "APPROVED" ? "Yayınla" : s === "REJECTED" ? "Reddet" : "Beklemeye al"}</button>
                </form>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
