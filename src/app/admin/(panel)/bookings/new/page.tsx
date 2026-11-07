import { Suspense } from "react";
import { t } from "@/server/catalog";
import { ActionForm } from "../../../action-form";
import { manualBookingAction } from "../../../actions";
import { bookingFormData, todayLocal } from "@/server/admin/ops";

export default function NewBooking() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-extrabold">Yeni rezervasyon</h1>
      <p className="mt-1 text-sm text-ink-soft">Telefon/WhatsApp ve ofis rezervasyonları. Müsaitlik ve çift rezervasyon kontrolü web ile aynıdır; ödeme teslimde.</p>
      <Suspense fallback={<p className="mt-6 text-ink-soft">Yükleniyor…</p>}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  const { models, locations, extras } = await bookingFormData();
  const today = todayLocal();
  // Default pick-up: next full hour in business time (walk-ins); return: +3 days.
  const nowLocal = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: process.env.BUSINESS_TZ ?? "Asia/Famagusta" }).format(new Date());
  const nextHour = Math.min(23, Number(nowLocal) + 1);
  const pickupTime = `${String(nextHour).padStart(2, "0")}:00`;
  const returnDate = new Date(Date.parse(`${today}T12:00:00Z`) + 3 * 86_400_000).toISOString().slice(0, 10);
  const sel = (name: string, label: string, opts: [string, string][]) => (
    <div><label className="label" htmlFor={name}>{label}</label><select id={name} name={name} className="field">{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
  );
  const locs = locations.map((l) => [l.slug, t(l.name, "tr")] as [string, string]);
  return (
    <ActionForm action={manualBookingAction} submit="Rezervasyonu oluştur" className="mt-6 space-y-6 rounded-2xl bg-paper p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {sel("modelSlug", "Araç modeli", models.map((m) => [m.slug, `${m.make} ${m.model} (£${m.dailyRate}/gün, ${m._count.vehicles} araç)`]))}
        <div />
        {sel("pickupLocation", "Alış yeri", locs)}
        {sel("returnLocation", "İade yeri", locs)}
        <div className="flex gap-2"><div className="flex-1"><label className="label" htmlFor="pd">Alış tarihi</label><input id="pd" type="date" name="pickupDate" defaultValue={today} className="field" required /></div><div><label className="label" htmlFor="pt">Saat</label><input id="pt" type="time" name="pickupTime" defaultValue={pickupTime} className="field" required /></div></div>
        <div className="flex gap-2"><div className="flex-1"><label className="label" htmlFor="rd">İade tarihi</label><input id="rd" type="date" name="returnDate" defaultValue={returnDate} className="field" required /></div><div><label className="label" htmlFor="rt">Saat</label><input id="rt" type="time" name="returnTime" defaultValue={pickupTime} className="field" required /></div></div>
      </div>
      <fieldset>
        <legend className="label">Ekstralar</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {extras.map((x) => (
            <label key={x.code} className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 px-3 py-2 text-sm">
              <span>{t(x.name, "tr")} <span className="text-ink-soft">£{x.price.toString()}{x.pricing === "PER_DAY" ? "/gün" : ""}</span></span>
              <input type="number" name={`extra_${x.code}`} min={0} max={x.maxQty} defaultValue={0} className="field !w-16 !py-1" />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        {[["firstName", "Ad"], ["lastName", "Soyad"], ["email", "E-posta"], ["phone", "Telefon"]].map(([n, l]) => (
          <div key={n}><label className="label" htmlFor={n}>{l}</label><input id={n} name={n} type={n === "email" ? "email" : "text"} className="field" required /></div>
        ))}
      </div>
      <div><label className="label" htmlFor="notes">Not</label><textarea id="notes" name="notes" rows={2} className="field" /></div>
    </ActionForm>
  );
}
