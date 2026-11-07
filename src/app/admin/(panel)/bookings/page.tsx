import { Suspense } from "react";
import Link from "next/link";
import { listBookings } from "@/server/admin/ops";
import { dt, gbp, StatusBadge, STATUS_TR } from "../../format";

export default function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold">Rezervasyonlar</h1>
        <Link href="/admin/bookings/new" className="btn-ink !py-2 text-sm">Yeni rezervasyon</Link>
      </div>
      <Suspense fallback={<p className="mt-6 text-ink-soft">Yükleniyor…</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function List({ searchParams }: { searchParams: PageProps<"/admin/bookings">["searchParams"] }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const f = { status: one(sp.status), q: one(sp.q), from: one(sp.from), page: Number(one(sp.page) ?? 1) || 1 };
  const { rows, total, page, pages } = await listBookings(f);
  const qs = (p: number) => new URLSearchParams({ ...(f.status ? { status: f.status } : {}), ...(f.q ? { q: f.q } : {}), ...(f.from ? { from: f.from } : {}), page: String(p) }).toString();
  return (
    <>
      <form className="mt-6 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={f.q} placeholder="Ref, plaka, e-posta, soyad, telefon" className="field !w-72" />
        <select name="status" defaultValue={f.status ?? ""} className="field !w-48">
          <option value="">Tüm durumlar</option>
          {Object.entries(STATUS_TR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink-soft">Alış tarihi ≥ <input type="date" name="from" defaultValue={f.from} className="field !w-40" /></label>
        <button className="btn-quiet !py-2 text-sm">Filtrele</button>
      </form>
      <p className="mt-4 text-sm text-ink-soft">{total} kayıt</p>
      <div className="mt-2 overflow-x-auto rounded-2xl bg-paper">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-ink/10 text-ink-soft">
            <tr>{["Ref", "Müşteri", "Araç", "Alış", "İade", "Tutar", "Durum"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-ink/5 hover:bg-stone/60">
                <td className="px-4 py-3"><Link href={`/admin/bookings/${b.ref}`} className="font-semibold text-aegean hover:underline">{b.ref}</Link>{b.source !== "web" && <span className="ml-1 text-xs text-ink-soft">({b.source})</span>}</td>
                <td className="px-4 py-3">{b.customer ? `${b.customer.firstName} ${b.customer.lastName}` : "—"}<br /><span className="text-ink-soft">{b.customer?.phone}</span></td>
                <td className="px-4 py-3">{b.model.make} {b.model.model}<br /><span className="text-ink-soft">{b.vehicle.plate}</span></td>
                <td className="px-4 py-3 whitespace-nowrap">{dt(b.pickupAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{dt(b.returnAt)}</td>
                <td className="px-4 py-3 tabular-nums">{gbp(b.grandTotal)}</td>
                <td className="px-4 py-3"><StatusBadge s={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="mt-4 flex gap-2 text-sm" aria-label="Sayfalar">
          {page > 1 && <Link className="btn-quiet !py-1.5" href={`?${qs(page - 1)}`}>Önceki</Link>}
          <span className="px-2 py-1.5 text-ink-soft">{page} / {pages}</span>
          {page < pages && <Link className="btn-quiet !py-1.5" href={`?${qs(page + 1)}`}>Sonraki</Link>}
        </nav>
      )}
    </>
  );
}
