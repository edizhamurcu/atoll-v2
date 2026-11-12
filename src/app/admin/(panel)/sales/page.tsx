import { Suspense } from "react";
import Image from "next/image";
import { requireAdmin } from "@/server/admin/auth";
import { listSaleCarsAdmin, stockPhotoUrl } from "@/server/sales";
import { ActionForm } from "../../action-form";
import { PhotoUploader } from "../../photo-uploader";
import { saleCarDeleteAction, saleCarPhotoDeleteAction, saleCarPhotoFirstAction, saleCarSaveAction, saleCarStatusAction } from "../../actions";

const STATUS = { AVAILABLE: "Satışta", RESERVED: "Rezerve", SOLD: "Satıldı", HIDDEN: "Gizli" } as const;
const FUEL = { PETROL: "Benzin", DIESEL: "Dizel", HYBRID: "Hibrit", ELECTRIC: "Elektrik", LPG: "LPG" } as const;
const BODY = { HATCHBACK: "Hatchback", SEDAN: "Sedan", ESTATE: "Station wagon", SUV: "SUV", VAN: "Van" } as const;
type Car = Awaited<ReturnType<typeof listSaleCarsAdmin>>[number];

export default function SalesAdmin() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Yükleniyor…</p>}>
      <Inner />
    </Suspense>
  );
}

function Fields({ c }: { c?: Car }) {
  const L = "text-sm font-medium";
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {c && <input type="hidden" name="id" value={c.id} />}
      <label className={L}>Marka<input name="make" required defaultValue={c?.make} className="field mt-1" /></label>
      <label className={L}>Model<input name="model" required defaultValue={c?.model} className="field mt-1" /></label>
      <label className={L}>Yıl<input name="year" type="number" required min={1950} max={2100} defaultValue={c?.year} className="field mt-1" /></label>
      <label className={L}>Kilometre<input name="mileageKm" type="number" required min={0} defaultValue={c?.mileageKm} className="field mt-1" /></label>
      <label className={L}>Yakıt<select name="fuel" defaultValue={c?.fuel ?? "PETROL"} className="field mt-1">{Object.entries(FUEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label className={L}>Vites<select name="transmission" defaultValue={c?.transmission ?? "AUTOMATIC"} className="field mt-1"><option value="AUTOMATIC">Otomatik</option><option value="MANUAL">Manuel</option></select></label>
      <label className={L}>Kasa<select name="bodyType" defaultValue={c?.bodyType ?? ""} className="field mt-1"><option value="">—</option>{Object.entries(BODY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label className={L}>Renk<input name="colour" defaultValue={c?.colour ?? ""} className="field mt-1" /></label>
      <label className={L}>Fiyat £ (boş = fiyat için sorun)<input name="price" inputMode="decimal" defaultValue={c?.price?.toFixed(0) ?? ""} className="field mt-1" /></label>
      <label className={`${L} sm:col-span-2`}>Kısa not (kartta görünür)<input name="note" maxLength={200} defaultValue={c?.note ?? ""} className="field mt-1" /></label>
      <label className={L}>Sıra<input name="sortOrder" type="number" min={0} defaultValue={c?.sortOrder ?? 0} className="field mt-1" /></label>
    </div>
  );
}

async function Inner() {
  const admin = await requireAdmin();
  const cars = await listSaleCarsAdmin();
  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-extrabold">Satılık araçlar (OSK)</h1>
      <p className="mt-2 text-ink-soft">{"\u201cSatışta\u201d ve \u201cRezerve\u201d araçlar satış sayfasında görünür; \u201cSatıldı\u201d ve \u201cGizli\u201d görünmez. Fotoğraflar 1600 px WebP olarak kaydedilir, ilk fotoğraf kartta görünür."}</p>

      <details className="mt-6 rounded-2xl bg-paper p-5" open={cars.length === 0}>
        <summary className="cursor-pointer text-lg font-bold">Yeni araç ekle</summary>
        <ActionForm action={saleCarSaveAction} submit="Ekle" className="mt-4 space-y-4"><Fields /></ActionForm>
      </details>

      <ul className="mt-8 space-y-6">
        {cars.map((c) => (
          <li key={c.id} className="rounded-2xl bg-paper p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{c.year} {c.make} {c.model} <span className="text-base font-medium text-ink-soft">· {c.mileageKm.toLocaleString("tr-TR")} km · {c.price ? `£${c.price.toFixed(0)}` : "fiyat için sorun"}</span></h2>
              <span className="rounded-full bg-stone px-3 py-1 text-sm font-semibold">{STATUS[c.status]}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {c.photos.map((p, i) => (
                <div key={p} className="w-36">
                  <Image unoptimized src={stockPhotoUrl(p)} alt="" width={288} height={216} className="aspect-[4/3] w-36 rounded-lg object-cover" />
                  <div className="mt-1 flex gap-1 text-xs">
                    {i > 0 && <form action={saleCarPhotoFirstAction}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="file" value={p} /><button className="text-aegean">Kapak yap</button></form>}
                    <form action={saleCarPhotoDeleteAction} className="ml-auto"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="file" value={p} /><button className="text-alert">Sil</button></form>
                  </div>
                </div>
              ))}
            </div>
            <PhotoUploader id={c.id} />
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(STATUS) as (keyof typeof STATUS)[]).filter((s) => s !== c.status).map((s) => (
                <form key={s} action={saleCarStatusAction}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="status" value={s} /><button className="btn-quiet !py-2 text-sm">{STATUS[s]} yap</button></form>
              ))}
              {admin.role === "owner" && (
                <form action={saleCarDeleteAction}><input type="hidden" name="id" value={c.id} /><button className="btn-quiet !py-2 text-sm text-alert">Kalıcı sil</button></form>
              )}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-aegean">Bilgileri düzenle</summary>
              <ActionForm action={saleCarSaveAction} submit="Kaydet" className="mt-3 space-y-4"><Fields c={c} /></ActionForm>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
