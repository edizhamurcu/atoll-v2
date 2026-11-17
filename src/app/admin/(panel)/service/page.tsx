import { Suspense } from "react";
import { requireAdmin } from "@/server/admin/auth";
import { listServiceRequestsAdmin } from "@/server/service-requests";
import { formatQueueNo, SERVICE_KIND_LABELS, SERVICE_STATUSES, type ServiceKindKey } from "@/content/service";
import { serviceUpdateAction } from "../../actions";
import { dt } from "../../format";

const LABEL: Record<(typeof SERVICE_STATUSES)[number], string> = {
  RECEIVED: "Alındı", SCHEDULED: "Planlandı", IN_PROGRESS: "Çalışılıyor", READY: "Teslime hazır", DELIVERED: "Teslim edildi", CANCELLED: "İptal",
};

export default function ServiceAdmin() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Yükleniyor…</p>}>
      <Inner />
    </Suspense>
  );
}

async function Inner() {
  await requireAdmin();
  const rows = await listServiceRequestsAdmin();
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-extrabold">OSK servis talepleri</h1>
      <p className="mt-2 text-ink-soft">Araç Satış sayfasındaki formdan gelen talepler (manager@ ve info@ adreslerine de e-posta gider). Durumu ve müşteriye görünen notu güncelleyin; müşteri sıra numarasıyla /service/&lt;no&gt; sayfasından takip eder.</p>
      {rows.length === 0 && <p className="mt-8 rounded-2xl bg-paper p-6 text-ink-soft">Henüz talep yok.</p>}
      <ul className="mt-6 space-y-4">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl bg-paper p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-2xl font-extrabold">{formatQueueNo(r.queueNo)}</span>
              <span className="rounded-full bg-stone px-3 py-1 text-sm font-semibold">{LABEL[r.status]}</span>
            </div>
            <p className="mt-2 font-semibold">{r.services.map((k) => SERVICE_KIND_LABELS[k as ServiceKindKey] ?? k).join(" · ")}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {r.vehicleMake} · {r.vehiclePlate}{r.vehicleYear ? ` · ${r.vehicleYear}` : ""} · {r.boughtFromOsk ? "OSK'tan alınmış" : "Dış araç"}{r.preferredDate ? ` · Tercih: ${r.preferredDate.toISOString().slice(0, 10)}` : ""}
            </p>
            {r.details && <p className="mt-3 whitespace-pre-line">{r.details}</p>}
            <p className="mt-3 text-sm text-ink-soft">
              {r.name} · <a className="text-aegean" href={`tel:${r.phone.replace(/\s/g, "")}`}>{r.phone}</a>{r.email ? <> · <a className="text-aegean" href={`mailto:${r.email}`}>{r.email}</a></> : null} · {dt(r.createdAt)} · {r.locale.toUpperCase()}{r.emailedAt ? "" : " · e-posta gitmedi"}
            </p>
            <form action={serviceUpdateAction} className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
              <input type="hidden" name="id" value={r.id} />
              <div>
                <label className="label" htmlFor={`st-${r.id}`}>Durum</label>
                <select id={`st-${r.id}`} name="status" defaultValue={r.status} className="field">
                  {SERVICE_STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor={`nt-${r.id}`}>Müşteriye görünen not</label>
                <input id={`nt-${r.id}`} name="publicNote" defaultValue={r.publicNote ?? ""} maxLength={1000} className="field" />
              </div>
              <button className="btn-ink !py-2 text-sm">Kaydet</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
