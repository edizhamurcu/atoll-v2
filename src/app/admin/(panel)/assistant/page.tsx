import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/server/admin/auth";
import { assistantOverview, usd } from "@/server/chat/admin";
import { assistantPurgeAction, assistantRequestAction, assistantSwitchAction } from "../../actions";
import { dt } from "../../format";

const PROBLEM: Record<string, string> = {
  ENV_DISABLED: "Sunucu ayarında kapalı (CHAT_ENABLED=true değil).",
  NO_KEY: "ANTHROPIC_API_KEY sunucu .env dosyasında yok.",
  NO_MODEL: "ANTHROPIC_MODEL ayarlanmamış.",
  NO_PRICES: "Model token fiyatları (CHAT_PRICE_INPUT/OUTPUT_PER_MTOK) ayarlanmamış; maliyet hesaplanamaz.",
  NO_BUDGET: "Günlük/aylık bütçe (CHAT_DAILY_BUDGET_USD / CHAT_MONTHLY_BUDGET_USD) ayarlanmamış.",
  ADMIN_OFF: "Ayarlar tamam; asistan bu panelden kapalı.",
};
const KIND: Record<string, string> = { HANDOFF: "Yetkiliyle görüşme", RENTAL_CALLBACK: "Kiralama geri arama", SALES_INQUIRY: "OSK satış", TEST_DRIVE: "OSK test sürüşü", SERVICE_APPOINTMENT: "OSK servis randevusu" };
const STATUS: Record<string, string> = { SUBMITTED: "Yeni", HANDLED: "İlgilenildi", CANCELLED: "İptal" };

export default function AssistantAdmin() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Yükleniyor…</p>}>
      <Inner />
    </Suspense>
  );
}

async function Inner() {
  const admin = await requireAdmin();
  const o = await assistantOverview();
  const c = o.status.cfg;
  const owner = admin.role === "owner";
  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Yapay zekâ asistanı</h1>
        <p className="mt-2 text-ink-soft">Sitedeki müşteri asistanı (Claude API). Fiyat ve müsaitliği rezervasyon motorundan alır; rezervasyon yapmaz, talepleri müşteri onaylayınca buraya düşer.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-paper p-5">
          <h2 className="font-semibold">Durum</h2>
          <p className={`mt-2 text-lg font-bold ${o.status.ready ? "text-[#14653a]" : "text-alert"}`}>{o.status.ready ? "Açık – yanıt veriyor" : "Kapalı"}</p>
          {o.status.problem && <p className="mt-1 text-sm text-ink-soft">{PROBLEM[o.status.problem] ?? o.status.problem}</p>}
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-ink-soft">API anahtarı</dt><dd>{c.hasKey ? "Tanımlı" : "Yok"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-ink-soft">Model</dt><dd className="font-mono text-xs">{c.model ?? "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-ink-soft">Araç turu / çıktı</dt><dd>{c.maxToolRounds} / {c.maxOutputTokens} token</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-ink-soft">Saklama</dt><dd>{c.retentionDays} gün</dd></div>
          </dl>
          {owner && (
            <form action={assistantSwitchAction} className="mt-4">
              <input type="hidden" name="state" value={o.status.problem === "ADMIN_OFF" || !o.status.ready ? "on" : "off"} />
              <button className={`${o.status.ready ? "btn-quiet" : "btn-ink"} !py-2 text-sm`}>{o.status.ready ? "Asistanı kapat" : "Asistanı aç"}</button>
            </form>
          )}
        </div>
        <div className="rounded-2xl bg-paper p-5">
          <h2 className="font-semibold">Harcama</h2>
          <p className="mt-2 text-sm text-ink-soft">Bugün (UTC)</p>
          <p className="text-lg font-bold">{usd(o.today)} <span className="text-sm font-normal text-ink-soft">/ {c.dailyBudgetUsd !== null ? `$${c.dailyBudgetUsd}` : "bütçe yok"}</span></p>
          <p className="mt-2 text-sm text-ink-soft">Bu ay</p>
          <p className="text-lg font-bold">{usd(o.month)} <span className="text-sm font-normal text-ink-soft">/ {c.monthlyBudgetUsd !== null ? `$${c.monthlyBudgetUsd}` : "bütçe yok"}</span></p>
          <p className="mt-2 text-xs text-ink-soft">Bütçe dolunca asistan çağrı yapmaz, müşteriye telefon/WhatsApp gösterir. Tutarlar .env&apos;deki token fiyatlarıyla hesaplanır; kesin fatura Anthropic Console&apos;dadır.</p>
        </div>
        <div className="rounded-2xl bg-paper p-5">
          <h2 className="font-semibold">Son 14 gün</h2>
          {o.days.length === 0 ? <p className="mt-2 text-sm text-ink-soft">Kullanım yok.</p> : (
            <table className="mt-2 w-full text-sm">
              <thead className="text-left text-ink-soft"><tr><th className="font-medium">Gün</th><th className="font-medium">Çağrı</th><th className="font-medium">Hata</th><th className="text-right font-medium">$</th></tr></thead>
              <tbody>{o.days.map((d) => <tr key={d.day.toISOString()}><td>{d.day.toISOString().slice(5, 10)}</td><td>{d.requests}</td><td>{d.errors}</td><td className="text-right">{usd(d.costUsd)}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Talepler</h2>
        <p className="mt-1 text-sm text-ink-soft">Müşterinin “Onayla” ile gönderdikleri. {o.drafts > 0 && `${o.drafts} taslak müşteri onayı bekliyor (burada görünmez).`} SMTP ayarlıysa ayrıca e-posta gider.</p>
        {o.requests.length === 0 ? <p className="mt-4 rounded-2xl bg-paper p-6 text-ink-soft">Henüz talep yok.</p> : (
          <ul className="mt-4 space-y-3">
            {o.requests.map((r) => (
              <li key={r.id} className="rounded-2xl bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{KIND[r.kind]} · {r.name} · <a className="text-aegean" href={`tel:${r.phone.replace(/\s/g, "")}`}>{r.phone}</a>{r.email && <> · <a className="text-aegean" href={`mailto:${r.email}`}>{r.email}</a></>}</p>
                  <span className="rounded-full bg-stone px-3 py-1 text-sm font-semibold">{STATUS[r.status]}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm">{r.details}</p>
                <p className="mt-2 text-xs text-ink-soft">{r.preferred && `Tercih: ${r.preferred} · `}{dt(r.confirmedAt ?? r.createdAt)} · {r.locale.toUpperCase()} · {r.emailedAt ? "e-posta gitti" : "e-posta gitmedi"} · <Link className="text-aegean" href={`/admin/assistant/${r.sessionId}`}>Sohbet</Link></p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["HANDLED", "CANCELLED", "SUBMITTED"] as const).filter((s) => s !== r.status).map((s) => (
                    <form key={s} action={assistantRequestAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={s} />
                      <button className={`${s === "HANDLED" ? "btn-ink" : "btn-quiet"} !py-1.5 text-sm`}>{s === "HANDLED" ? "İlgilenildi" : s === "CANCELLED" ? "İptal" : "Yeniye al"}</button>
                    </form>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">Yanıtlanamayan sorular</h2>
        <p className="mt-1 text-sm text-ink-soft">Asistanın bilgisi olmadığı veya hata/bütçe nedeniyle yanıt veremediği sorular. Sık gelenleri sitedeki içeriğe eklemek asistanı da iyileştirir.</p>
        {o.unanswered.length === 0 ? <p className="mt-4 rounded-2xl bg-paper p-6 text-ink-soft">Yok.</p> : (
          <ul className="mt-4 divide-y divide-ink/10 rounded-2xl bg-paper">
            {o.unanswered.map((u) => (
              <li key={u.id} className="flex flex-wrap items-baseline justify-between gap-2 p-4 text-sm">
                <span className="min-w-0 flex-1 break-words">{u.question}</span>
                <span className="text-xs text-ink-soft">{/^\[[A-Z]+\]$/.test(u.text) ? u.text : "bilgi yok"} · {dt(u.createdAt)} · <Link className="text-aegean" href={`/admin/assistant/${u.sessionId}`}>Sohbet</Link></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Son sohbetler</h2>
            <p className="mt-1 text-sm text-ink-soft">{c.retentionDays} günden eski sohbetler otomatik silinir (IP adresi saklanmaz, yalnız tek yönlü özet).</p>
          </div>
          {owner && <form action={assistantPurgeAction}><button className="btn-quiet !py-1.5 text-sm">Eskileri şimdi temizle</button></form>}
        </div>
        {o.sessions.length === 0 ? <p className="mt-4 rounded-2xl bg-paper p-6 text-ink-soft">Henüz sohbet yok.</p> : (
          <table className="mt-4 w-full rounded-2xl bg-paper text-sm">
            <thead className="text-left text-ink-soft"><tr><th className="p-3 font-medium">Son mesaj</th><th className="p-3 font-medium">Dil</th><th className="p-3 font-medium">Mesaj</th><th className="p-3 font-medium">Talep</th><th className="p-3 text-right font-medium">Maliyet</th></tr></thead>
            <tbody className="divide-y divide-ink/10">
              {o.sessions.map((s) => (
                <tr key={s.id}><td className="p-3"><Link className="text-aegean" href={`/admin/assistant/${s.id}`}>{dt(s.lastAt)}</Link></td><td className="p-3">{s.locale.toUpperCase()}</td><td className="p-3">{s.messages}</td><td className="p-3">{s._count.requests}</td><td className="p-3 text-right">{usd(s.costUsd)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
