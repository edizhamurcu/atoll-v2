import { Suspense } from "react";
import { ActionForm } from "../../action-form";
import { blockAction, deleteBlockAction, vehicleStatusAction } from "../../actions";
import { dt } from "../../format";
import { fleetOverview, todayLocal } from "@/server/admin/ops";

const STATE: Record<string, [string, string]> = { available: ["Müsait", "text-aegean"], on_rent: ["Kirada", "text-ink"], maintenance: ["Bakımda", "text-alert"] };

export default function FleetPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Filo</h1>
      <Suspense fallback={<p className="mt-6 text-ink-soft">Yükleniyor…</p>}>
        <Inner />
      </Suspense>
    </div>
  );
}

async function Inner() {
  const { vehicles, board, blocks } = await fleetOverview();
  const live = new Map(board.map((b) => [b.vehicleId, b]));
  const today = todayLocal();
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="overflow-x-auto rounded-2xl bg-paper">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-ink/10 text-ink-soft"><tr>{["Plaka", "Model", "Şu an", "Sıradaki", ""].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {vehicles.map((v) => {
              const s = live.get(v.id);
              const [label, tone] = STATE[s?.state ?? "available"];
              return (
                <tr key={v.id} className="border-b border-ink/5">
                  <td className="px-4 py-2.5 font-semibold">{v.plate}</td>
                  <td className="px-4 py-2.5">{v.model.make} {v.model.model} <span className="text-ink-soft">{v.year ?? ""} {v.color ?? ""}</span></td>
                  <td className={`px-4 py-2.5 font-medium ${tone}`}>{label}{s?.currentBooking && <span className="block text-xs font-normal text-ink-soft">{s.currentBooking.ref}, iade {dt(s.currentBooking.until!)}</span>}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-soft">{s?.nextBooking ? `${s.nextBooking.ref} · ${dt(s.nextBooking.from!)}` : "—"}</td>
                  <td className="px-4 py-2.5">
                    <form action={vehicleStatusAction}>
                      <input type="hidden" name="id" value={v.id} />
                      <input type="hidden" name="status" value={v.status === "MAINTENANCE" ? "ACTIVE" : "MAINTENANCE"} />
                      <button className="text-xs text-aegean underline">{v.status === "MAINTENANCE" ? "Aktif yap" : "Bakıma al"}</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-6">
        <section className="rounded-2xl bg-paper p-5">
          <h2 className="text-lg font-bold">Blokaj ekle</h2>
          <p className="text-sm text-ink-soft">Servis, muayene, kaza: araç bu aralıkta kiralanamaz.</p>
          <ActionForm action={blockAction} submit="Blokaj ekle" className="mt-3 space-y-3">
            <select name="vehicleId" className="field" aria-label="Araç">{vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.model.make} {v.model.model}</option>)}</select>
            <div className="flex gap-2"><input type="date" name="startDate" defaultValue={today} className="field" aria-label="Başlangıç" /><input type="time" name="startTime" defaultValue="09:00" className="field !w-28" aria-label="Saat" /></div>
            <div className="flex gap-2"><input type="date" name="endDate" defaultValue={today} className="field" aria-label="Bitiş" /><input type="time" name="endTime" defaultValue="18:00" className="field !w-28" aria-label="Saat" /></div>
            <input name="reason" placeholder="Sebep (ör. periyodik bakım)" className="field" required />
          </ActionForm>
        </section>
        <section className="rounded-2xl bg-paper p-5">
          <h2 className="text-lg font-bold">Aktif ve gelecek blokajlar</h2>
          {blocks.length === 0 ? <p className="mt-2 text-sm text-ink-soft">Blokaj yok.</p> : (
            <ul className="mt-2 divide-y divide-ink/8 text-sm">
              {blocks.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-3 py-2">
                  <span><b>{k.vehicle.plate}</b> {k.reason}<br /><span className="text-ink-soft">{dt(k.startAt)} – {dt(k.endAt)}</span></span>
                  <form action={deleteBlockAction}><input type="hidden" name="id" value={k.id} /><button className="text-xs text-alert underline">Kaldır</button></form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
