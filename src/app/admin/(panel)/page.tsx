import { Suspense } from "react";
import Link from "next/link";
import { dashboard } from "@/server/admin/ops";
import { tm, StatusBadge } from "../format";

export default function Dashboard() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Yükleniyor…</p>}>
      <Inner />
    </Suspense>
  );
}

async function Inner() {
  const d = await dashboard();
  const stats = [
    ["Müsait araç", d.counts.available, "text-aegean"],
    ["Kirada", d.counts.on_rent, "text-ink"],
    ["Bakımda", d.counts.maintenance, "text-alert"],
    ["7 gün içinde teslim", d.upcoming, "text-ink"],
  ] as const;
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Bugün</h1>
      <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([k, v, c]) => (
          <div key={k} className="rounded-2xl bg-paper p-4">
            <dt className="text-sm text-ink-soft">{k}</dt>
            <dd className={`font-display text-3xl font-extrabold ${c}`}>{v}</dd>
          </div>
        ))}
      </dl>
      {d.pending > 0 && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><Link href="/admin/bookings?status=PENDING_PAYMENT" className="underline">{d.pending} rezervasyon ödeme bekliyor</Link></p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Board title={`Teslim edilecek (${d.pickups.length})`} rows={d.pickups.map((b) => ({ ref: b.ref, time: tm(b.pickupAt), who: `${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}`, car: `${b.model.make} ${b.model.model} · ${b.vehicle.plate}`, where: b.deliveryZone ? `Teslimat: ${b.deliveryAddress ?? b.deliveryZone.name}` : b.pickupLocation.address, status: b.status }))} />
        <Board title={`İade alınacak (${d.returns.length})`} rows={d.returns.map((b) => ({ ref: b.ref, time: tm(b.returnAt), who: `${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}`, car: `${b.model.make} ${b.model.model} · ${b.vehicle.plate}`, where: b.returnLocation.address, status: b.status }))} />
      </div>
    </div>
  );
}

function Board({ title, rows }: { title: string; rows: { ref: string; time: string; who: string; car: string; where: string; status: string }[] }) {
  return (
    <section className="rounded-2xl bg-paper p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {rows.length === 0 ? <p className="mt-3 text-sm text-ink-soft">Bugün için kayıt yok.</p> : (
        <ul className="mt-3 divide-y divide-ink/8">
          {rows.map((r) => (
            <li key={r.ref} className="flex gap-4 py-3">
              <span className="w-14 shrink-0 font-display text-lg font-bold tabular-nums">{r.time}</span>
              <div className="min-w-0 text-sm">
                <Link href={`/admin/bookings/${r.ref}`} className="font-semibold hover:text-aegean">{r.who || r.ref}</Link> <StatusBadge s={r.status} />
                <p className="text-ink-soft">{r.car}</p>
                <p className="truncate text-ink-soft">{r.where}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
