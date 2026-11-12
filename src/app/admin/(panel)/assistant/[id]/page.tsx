import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/admin/auth";
import { transcript, usd } from "@/server/chat/admin";
import { dt } from "../../../format";

export default function TranscriptPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Yükleniyor…</p>}>
      <Inner params={props.params} />
    </Suspense>
  );
}

async function Inner({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const s = await transcript((await params).id);
  if (!s) notFound();
  return (
    <div className="max-w-3xl">
      <Link href="/admin/assistant" className="text-sm text-aegean">← Asistan</Link>
      <h1 className="mt-2 text-2xl font-extrabold">Sohbet</h1>
      <p className="mt-1 text-sm text-ink-soft">{dt(s.createdAt)} · {s.locale.toUpperCase()} · {s.page ?? "—"} · {s.messages} mesaj · {usd(s.costUsd)}</p>
      <ol className="mt-6 space-y-3">
        {s.log.map((m) => (
          <li key={m.id} className={`rounded-2xl p-4 text-sm ${m.role === "user" ? "ml-10 bg-aegean/10" : "mr-10 bg-paper"}`}>
            <p className="whitespace-pre-line break-words">{m.text}</p>
            <p className="mt-2 text-xs text-ink-soft">{m.role === "user" ? "Müşteri" : "Asistan"} · {dt(m.createdAt)}{m.tools.length > 0 && ` · araçlar: ${m.tools.join(", ")}`}{m.unanswered && " · yanıtlanamadı"}</p>
          </li>
        ))}
      </ol>
      {s.requests.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-bold">Talepler</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {s.requests.map((r) => <li key={r.id} className="rounded-xl bg-paper p-3">{r.kind} · {r.status} · {r.name} · {r.phone} · {r.details}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
