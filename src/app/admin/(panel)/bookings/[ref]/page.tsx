import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingAdmin, TRANSITIONS } from "@/server/admin/ops";
import { ActionForm } from "../../../action-form";
import { reassignAction, statusAction } from "../../../actions";
import { dt, gbp, StatusBadge, STATUS_TR } from "../../../format";
import { getTranslations } from "next-intl/server";
import { bookingReview, reviewToken } from "@/server/reviews";
import { SITE } from "@/lib/site";

export default function BookingDetail({ params }: PageProps<"/admin/bookings/[ref]">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Yükleniyor…</p>}>
      <Inner params={params} />
    </Suspense>
  );
}

async function Inner({ params }: { params: PageProps<"/admin/bookings/[ref]">["params"] }) {
  const { ref } = await params;
  const data = await getBookingAdmin(decodeURIComponent(ref));
  if (!data) notFound();
  const { booking: b, freeVehicles, history } = data;
  const next = TRANSITIONS[b.status];
  const breakdown = b.priceBreakdown as { lines?: { kind: string; code: string; quantity: number; total: string }[] } | null;
  const wa = b.customer ? `https://wa.me/${b.customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Atoll Rent a Car — ${b.ref}`)}` : null;
  return (
    <div className="max-w-5xl">
      <Link href="/admin/bookings" className="text-sm text-aegean">← Rezervasyonlar</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">{b.ref}</h1>
        <StatusBadge s={b.status} />
        <span className="text-sm text-ink-soft">Kaynak: {b.source} · Ödeme: {b.paymentMode === "deposit" ? `depozito (${b.paymentStatus})` : "teslimde"}</span>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4 rounded-2xl bg-paper p-5">
          <h2 className="text-lg font-bold">{b.model.make} {b.model.model} <span className="font-normal text-ink-soft">· {b.vehicle.plate}</span></h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-ink-soft">Alış</dt><dd className="font-medium">{dt(b.pickupAt)}</dd><dd>{b.pickupLocation.address}</dd></div>
            <div><dt className="text-ink-soft">İade</dt><dd className="font-medium">{dt(b.returnAt)}</dd><dd>{b.returnLocation.address}</dd></div>
            {b.deliveryZone && <div className="sm:col-span-2"><dt className="text-ink-soft">Teslimat</dt><dd>{b.deliveryZone.name} — {b.deliveryAddress ?? "adres yok"}</dd></div>}
            <div><dt className="text-ink-soft">Gün</dt><dd>{b.days}</dd></div>
            <div><dt className="text-ink-soft">Uçuş</dt><dd>{b.flightNumber ?? "—"}</dd></div>
          </dl>
          <table className="w-full text-sm">
            <tbody>
              {(breakdown?.lines ?? []).map((l, i) => (
                <tr key={i} className="border-t border-ink/5"><td className="py-1.5">{l.code}{l.quantity > 1 ? ` ×${l.quantity}` : ""}</td><td className="py-1.5 text-right tabular-nums">{gbp(l.total)}</td></tr>
              ))}
              <tr className="border-t border-ink/15 font-bold"><td className="py-2">Toplam</td><td className="py-2 text-right tabular-nums">{gbp(b.grandTotal)}</td></tr>
              <tr><td className="text-ink-soft">Depozito</td><td className="text-right tabular-nums">{gbp(b.depositAmount)}</td></tr>
            </tbody>
          </table>
          {b.notes && <p className="whitespace-pre-line rounded-xl bg-stone p-3 text-sm">{b.notes}</p>}
        </section>
        <div className="space-y-6">
          <section className="rounded-2xl bg-paper p-5 text-sm">
            <h2 className="text-lg font-bold">Müşteri</h2>
            {b.customer ? (
              <dl className="mt-2 space-y-1">
                <dd className="font-medium">{b.customer.firstName} {b.customer.lastName}</dd>
                <dd><a className="text-aegean" href={`mailto:${b.customer.email}`}>{b.customer.email}</a></dd>
                <dd><a className="text-aegean" href={`tel:${b.customer.phone}`}>{b.customer.phone}</a>{wa && <> · <a className="text-aegean" href={wa} rel="noopener">WhatsApp</a></>}</dd>
                {b.customer.licenseNumber && <dd>Ehliyet: {b.customer.licenseNumber}</dd>}
                {b.customer.country && <dd>Ülke: {b.customer.country}</dd>}
              </dl>
            ) : <p className="mt-2 text-ink-soft">Müşteri bilgisi henüz girilmedi.</p>}
          </section>
          {next.length > 0 && (
            <section className="rounded-2xl bg-paper p-5">
              <h2 className="text-lg font-bold">Durum</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {next.map((s) => (
                  <ActionForm key={s} action={statusAction} submit={STATUS_TR[s]} tone={s === "CANCELLED" || s === "NO_SHOW" ? "danger" : "ink"}>
                    <input type="hidden" name="ref" value={b.ref} />
                    <input type="hidden" name="status" value={s} />
                  </ActionForm>
                ))}
              </div>
            </section>
          )}
          {["HOLD", "PENDING_PAYMENT", "CONFIRMED"].includes(b.status) && (
            <section className="rounded-2xl bg-paper p-5">
              <h2 className="text-lg font-bold">Aracı değiştir</h2>
              {freeVehicles.length === 0 ? <p className="mt-2 text-sm text-ink-soft">Bu tarihlerde aynı modelden boş araç yok.</p> : (
                <ActionForm action={reassignAction} submit="Değiştir" className="mt-3 flex flex-wrap items-start gap-3">
                  <input type="hidden" name="ref" value={b.ref} />
                  <select name="vehicleId" className="field !w-40" aria-label="Yeni plaka">
                    {freeVehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                  </select>
                </ActionForm>
              )}
            </section>
          )}
          {["CONFIRMED", "COMPLETED"].includes(b.status) && <ReviewLink id={b.id} refCode={b.ref} locale={b.locale} phone={b.customer?.phone} />}
          <section className="rounded-2xl bg-paper p-5 text-sm">
            <h2 className="text-lg font-bold">Geçmiş</h2>
            <ul className="mt-2 space-y-1 text-ink-soft">
              <li>{dt(b.createdAt)} — oluşturuldu ({b.source})</li>
              {history.map((h) => <li key={h.id}>{dt(h.createdAt)} — {h.action}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Signed review link for this booking, with a ready WhatsApp message in the customer's language. */
async function ReviewLink({ id, refCode, locale, phone }: { id: string; refCode: string; locale: string; phone?: string }) {
  const [r, t] = await Promise.all([bookingReview(id), getTranslations({ locale: ["en", "tr", "de", "ru"].includes(locale) ? locale : "en", namespace: "review" })]);
  const url = `${SITE.url}/${locale}/review/${reviewToken(refCode)}`;
  const wa = phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(t("waText", { url }))}` : null;
  return (
    <section className="rounded-2xl bg-paper p-5 text-sm">
      <h2 className="text-lg font-bold">Müşteri yorumu</h2>
      {r ? (
        <p className="mt-2">Yorum alındı: {"★".repeat(r.rating)} · durum: <Link href="/admin/reviews" className="text-aegean">{r.status === "PENDING" ? "onay bekliyor" : r.status === "APPROVED" ? "yayında" : "reddedildi"}</Link></p>
      ) : (
        <>
          <p className="mt-2 text-ink-soft">Kiralama başladıktan sonra müşteriye gönderin. Yorum onayınızdan sonra sitede görünür.</p>
          <input readOnly value={url} aria-label="Yorum bağlantısı" className="field mt-3 !text-xs" />
          {wa && <a href={wa} rel="noopener" className="btn-ink mt-3 !py-2 text-sm">WhatsApp ile gönder</a>}
        </>
      )}
    </section>
  );
}
