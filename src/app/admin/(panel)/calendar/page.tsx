import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { formatInTimeZone } from "date-fns-tz";
import { gantt, todayLocal } from "@/server/admin/ops";

const TZ = process.env.BUSINESS_TZ ?? "Asia/Famagusta";
const DAYS = 14;
const COLORS: Record<string, string> = { CONFIRMED: "bg-aegean text-white", PENDING_PAYMENT: "bg-amber-400 text-ink", HOLD: "bg-stone-deep text-ink", COMPLETED: "bg-ink/70 text-white" };

export default function CalendarPage({ searchParams }: PageProps<"/admin/calendar">) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Takvim</h1>
      <Suspense fallback={<p className="mt-6 text-ink-soft">Yükleniyor…</p>}>
        <Grid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Grid({ searchParams }: { searchParams: PageProps<"/admin/calendar">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const from = typeof sp.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : todayLocal();
  const { start, vehicles } = await gantt(from, DAYS);
  const dayMs = 86_400_000, total = DAYS * dayMs;
  const pct = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - start.getTime()) / total) * 100));
  const shift = (n: number) => formatInTimeZone(new Date(start.getTime() + n * dayMs + 12 * 3_600_000), TZ, "yyyy-MM-dd");
  const days = Array.from({ length: DAYS }, (_, i) => new Date(start.getTime() + i * dayMs + 12 * 3_600_000));
  return (
    <>
      <div className="mt-4 flex items-center gap-2 text-sm">
        <Link className="btn-quiet !py-1.5" href={`?from=${shift(-7)}`}>← 7 gün</Link>
        <Link className="btn-quiet !py-1.5" href="?">Bugün</Link>
        <Link className="btn-quiet !py-1.5" href={`?from=${shift(7)}`}>7 gün →</Link>
        <span className="ml-3 flex items-center gap-3 text-ink-soft">
          <i className="inline-block size-3 rounded bg-aegean" /> Onaylı <i className="inline-block size-3 rounded bg-amber-400" /> Ödeme bekliyor <i className="inline-block size-3 rounded bg-stone-deep" /> Ayrıldı <i className="inline-block size-3 rounded bg-[repeating-linear-gradient(45deg,#a33a1f33_0_4px,transparent_4px_8px)] ring-1 ring-alert/40" /> Blokaj
        </span>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl bg-paper">
        <div className="min-w-[64rem]">
          <div className="grid grid-cols-[11rem_1fr] border-b border-ink/10 text-xs text-ink-soft">
            <div className="px-3 py-2">Araç</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${DAYS}, 1fr)` }}>
              {days.map((d) => <div key={d.toISOString()} className="border-l border-ink/5 px-1 py-2 text-center">{new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric", timeZone: TZ }).format(d)}</div>)}
            </div>
          </div>
          {vehicles.map((v) => (
            <div key={v.id} className="grid grid-cols-[11rem_1fr] border-b border-ink/5 text-xs">
              <div className="truncate px-3 py-2"><span className="font-semibold">{v.plate}</span> <span className="text-ink-soft">{v.model.make} {v.model.model}</span>{v.status === "MAINTENANCE" && <span className="text-alert"> · bakım</span>}</div>
              <div className="relative h-9" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent calc(100%/${DAYS} - 1px), rgba(13,52,64,.06) calc(100%/${DAYS} - 1px), rgba(13,52,64,.06) calc(100%/${DAYS}))` }}>
                {v.blocks.map((k) => (
                  <div key={k.id} title={k.reason} className="absolute inset-y-1 rounded bg-[repeating-linear-gradient(45deg,#a33a1f33_0_4px,transparent_4px_8px)] ring-1 ring-alert/40" style={{ left: `${pct(k.startAt)}%`, width: `${pct(k.endAt) - pct(k.startAt)}%` }} />
                ))}
                {v.bookings.map((b) => (
                  <Link key={b.id} href={`/admin/bookings/${b.ref}`} title={`${b.ref} ${b.customer?.lastName ?? ""}`}
                    className={`absolute inset-y-1 overflow-hidden whitespace-nowrap rounded px-1.5 leading-7 hover:ring-2 hover:ring-ink ${COLORS[b.status] ?? "bg-stone-deep"}`}
                    style={{ left: `${pct(b.pickupAt)}%`, width: `${Math.max(0.8, pct(b.returnAt) - pct(b.pickupAt))}%` }}>
                    {b.customer?.lastName ?? b.ref}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
