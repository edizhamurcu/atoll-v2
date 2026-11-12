"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { money } from "@/lib/search-params";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

type RentalCard = { type: "rental"; slug: string; name: string; seats: number; transmission: string; image: string | null; available: boolean | null; total: string | null; days: number | null; fromDaily: string; href: string; campaign: boolean };
type SaleCard = { type: "sale"; id: string; title: string; year: number; mileageKm: number; price: string | null; photo: string | null; status: string; note: string | null; href: string };
type Card = RentalCard | SaleCard;
type Draft = { id: string; kind: string; name: string; phone: string; email: string | null; preferred: string | null; details: string; state?: "open" | "sent" | "dismissed" | "failed" };
type Item =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; text: string; cards: Card[]; drafts: Draft[]; error?: "BUDGET" | "UNAVAILABLE" | "LIMIT" | "LONG" };

const STORE = "atoll-assistant-v1";
const load = (): { sessionId?: string; items: Item[] } => {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? "") ?? { items: [] };
  } catch {
    return { items: [] };
  }
};
const save = (v: { sessionId?: string; items: Item[] }) => {
  try {
    sessionStorage.setItem(STORE, JSON.stringify({ ...v, items: v.items.slice(-40) }));
  } catch {}
};

/** Links the model may write: site paths (/en/…) and our own domains, phone and WhatsApp. Everything else stays plain text. */
const LINK = /(\/(?:en|tr|de|ru)\/[\w\-/#?=&%.]*|https:\/\/(?:new\.)?atollrentacar\.com[\w\-/#?=&%.]*|https:\/\/wa\.me\/\d+[\w?=&%.\-]*)/g;
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="whitespace-pre-line [&+&]:mt-2">
          {para.split(LINK).map((part, j) =>
            j % 2 === 1 ? (
              <a key={j} href={part} className="font-medium text-aegean underline underline-offset-2" {...(part.startsWith("https://wa.me") ? { target: "_blank", rel: "noopener" } : {})}>{part.replace(/^https:\/\/(new\.)?atollrentacar\.com/, "")}</a>
            ) : (
              part.split(/\*\*(.+?)\*\*/g).map((s, k) => (k % 2 ? <strong key={k}>{s}</strong> : s.replace(/^#+\s/gm, "")))
            ),
          )}
        </p>
      ))}
    </>
  );
}

function Spark({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9L12 2.5zM18.5 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
    </svg>
  );
}

export function AssistantLauncher({ phone, waHref }: { phone: string; waHref: string }) {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const path = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<number | null>(null);
  const nextId = useRef(1);
  const loaded = useRef(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/v1/chat", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => {
        const s = load();
        nextId.current = Math.max(0, ...s.items.map((i) => i.id)) + 1;
        loaded.current = true;
        setItems(s.items);
        setSessionId(s.sessionId);
        setEnabled(Boolean(b?.enabled));
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (loaded.current) save({ sessionId, items });
  }, [sessionId, items]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [items, busy]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const close = () => {
    setOpen(false);
    launcher.current?.focus();
  };

  const patch = useCallback((id: number, fn: (a: Extract<Item, { role: "assistant" }>) => Extract<Item, { role: "assistant" }>) => {
    setItems((all) => all.map((i) => (i.id === id && i.role === "assistant" ? fn(i) : i)));
  }, []);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy) return;
    if (msg.length > 1000) {
      setItems((all) => [...all, { id: nextId.current++, role: "assistant", text: "", cards: [], drafts: [], error: "LONG" }]);
      return;
    }
    setInput("");
    const aid = nextId.current + 1;
    setItems((all) => [...all, { id: nextId.current++, role: "user", text: msg }, { id: nextId.current++, role: "assistant", text: "", cards: [], drafts: [] }]);
    setBusy(true);
    setPending(aid);
    const ctl = new AbortController();
    abort.current = ctl;
    try {
      const res = await fetch("/api/v1/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, message: msg, locale, page: path }), signal: ctl.signal });
      if (!res.ok || !res.body) {
        const code = res.status === 413 ? "LONG" : res.status === 429 || res.status === 409 ? "LIMIT" : "UNAVAILABLE";
        if (res.status === 503) setEnabled(false);
        patch(aid, (a) => ({ ...a, error: code }));
        return;
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        let cut;
        while ((cut = buf.indexOf("\n\n")) >= 0) {
          const line = buf.slice(0, cut).replace(/^data: /, "");
          buf = buf.slice(cut + 2);
          let e: { type: string; [k: string]: unknown };
          try {
            e = JSON.parse(line);
          } catch {
            continue;
          }
          if (e.type === "session") setSessionId(e.sessionId as string);
          else if (e.type === "text") patch(aid, (a) => ({ ...a, text: a.text + (e.text as string) }));
          else if (e.type === "cards") patch(aid, (a) => ({ ...a, cards: [...a.cards.filter((c) => !(e.cards as Card[]).some((n) => key(n) === key(c))), ...(e.cards as Card[])].slice(-6) }));
          else if (e.type === "draft") patch(aid, (a) => ({ ...a, drafts: [...a.drafts, { ...(e.draft as Draft), state: "open" }] }));
          else if (e.type === "error") patch(aid, (a) => ({ ...a, error: e.code as "BUDGET" }));
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") patch(aid, (a) => ({ ...a, error: "UNAVAILABLE" }));
    } finally {
      setBusy(false);
      setPending(null);
      abort.current = null;
    }
  }

  async function decide(aid: number, d: Draft, action: "confirm" | "dismiss") {
    patch(aid, (a) => ({ ...a, drafts: a.drafts.map((x) => (x.id === d.id ? { ...x, state: undefined } : x)) }));
    let state: Draft["state"] = "failed";
    try {
      const r = await fetch(`/api/v1/chat/requests/${d.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, action }) });
      if (r.ok) state = action === "confirm" ? "sent" : "dismissed";
    } catch {}
    patch(aid, (a) => ({ ...a, drafts: a.drafts.map((x) => (x.id === d.id ? { ...x, state } : x)) }));
  }

  function reset() {
    abort.current?.abort();
    setItems([]);
    setSessionId(undefined);
    inputRef.current?.focus();
  }

  if (!enabled) return null;
  const suggestions = [t("s1"), t("s2"), t("s3"), t("s4"), t("s5")];
  const tel = `tel:${phone.replace(/\s/g, "")}`;

  return (
    <>
      <button
        ref={launcher}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="assistant-panel"
        className="inline-flex h-12 items-center gap-2 rounded-full bg-aegean pl-3.5 pr-4 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(13,52,64,.55)] transition-transform hover:scale-[1.03] focus-visible:outline-offset-4 motion-reduce:transition-none max-[359px]:size-12 max-[359px]:justify-center max-[359px]:p-0"
      >
        <Spark />
        <span className="max-[359px]:sr-only">{t("label")}</span>
      </button>

      {open && createPortal(
        <div
          id="assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-title"
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-paper sm:border sm:border-ink/10 shadow-[0_24px_60px_-20px_rgba(13,52,64,.6)] sm:inset-auto sm:bottom-36 sm:right-6 sm:h-[min(40rem,calc(100dvh-11rem))] sm:w-[24rem] sm:rounded-2xl"
        >
          <header className="flex items-start gap-3 border-b border-ink/10 bg-aegean px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:pt-3">
            <Spark className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 id="assistant-title" className="font-semibold leading-tight">{t("title")}</h2>
              <p className="mt-0.5 text-xs text-white/80">{t("label")}</p>
            </div>
            {items.length > 0 && (
              <button type="button" onClick={reset} className="rounded-md px-2 py-1 text-xs font-medium text-white/90 underline-offset-2 hover:underline">{t("new")}</button>
            )}
            <button type="button" onClick={close} aria-label={t("close")} className="-mr-1 grid size-8 place-items-center rounded-full hover:bg-white/15">
              <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 text-[0.94rem] leading-relaxed" aria-live="polite" aria-busy={busy}>
            <div className="rounded-2xl rounded-tl-sm bg-stone px-3.5 py-2.5">
              <p>{t("intro")}</p>
            </div>
            {items.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-aegean/25 px-3 py-1.5 text-left text-sm text-aegean hover:bg-aegean/5">{s}</button>
                ))}
              </div>
            )}
            {items.map((it) =>
              it.role === "user" ? (
                <div key={it.id} className="ml-auto w-fit max-w-[85%] whitespace-pre-line break-words rounded-2xl rounded-tr-sm bg-aegean px-3.5 py-2.5 text-white">{it.text}</div>
              ) : (
                <div key={it.id} className="space-y-2">
                  {(it.text || (!it.error && pending === it.id)) && (
                    <div className="max-w-[92%] break-words rounded-2xl rounded-tl-sm bg-stone px-3.5 py-2.5">
                      {it.text ? <RichText text={it.text} /> : <p className="text-ink-soft">{t("busy")}</p>}
                    </div>
                  )}
                  {it.cards.length > 0 && <Cards cards={it.cards} locale={locale} t={t} />}
                  {it.drafts.map((d) => <DraftCard key={d.id} d={d} t={t} onDecide={(a) => decide(it.id, d, a)} />)}
                  {it.error && (
                    <div className="rounded-xl border border-ink/10 bg-paper px-3.5 py-3 text-sm">
                      <p>{it.error === "BUDGET" ? t("errBudget") : it.error === "LIMIT" ? t("errLimit") : it.error === "LONG" ? t("errLong") : t("errUnavailable")}</p>
                      {it.error !== "LONG" && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a href={waHref} target="_blank" rel="noopener" className="btn-wa !py-2 text-sm"><WhatsAppIcon />{t("whatsapp")}</a>
                          <a href={tel} className="inline-flex items-center rounded-full border border-ink/15 px-4 py-2 font-semibold">{t("call")} {phone}</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          <form
            className="border-t border-ink/10 bg-paper px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <p className="px-1 pb-1.5 text-[0.7rem] leading-snug text-ink-soft">{t("disclaimer")} {t("privacy")}</p>
            <div className="flex items-end gap-2">
              <label htmlFor="assistant-input" className="sr-only">{t("placeholder")}</label>
              <textarea
                id="assistant-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={1000}
                placeholder={t("placeholder")}
                className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-base focus:border-aegean focus:outline-none"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label={t("send")} className="grid size-11 shrink-0 place-items-center rounded-full bg-aegean text-white disabled:opacity-40">
                <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="currentColor"><path d="M3.4 20.4l17.5-7.5c.8-.4.8-1.5 0-1.8L3.4 3.6c-.7-.3-1.4.3-1.3 1l1.2 6.4 9 1-9 1-1.2 6.4c-.1.7.6 1.3 1.3 1z" /></svg>
              </button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </>
  );
}

const key = (c: Card) => (c.type === "rental" ? `r:${c.slug}` : `s:${c.id}`);
type T = ReturnType<typeof useTranslations<"assistant">>;

function Cards({ cards, locale, t }: { cards: Card[]; locale: string; t: T }) {
  return (
    <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
      {cards.map((c) => (
        <li key={key(c)} className="w-44 shrink-0 snap-start overflow-hidden rounded-xl border border-ink/10 bg-white">
          {c.type === "rental" ? (
            <a href={c.href} className="block">
              <div className="relative aspect-[16/10] bg-stone">
                {c.image && <Image src={c.image} alt="" fill sizes="176px" className="object-contain p-1" />}
              </div>
              <div className="p-2.5 text-sm">
                <p className="font-semibold leading-tight">{c.name}</p>
                <p className="mt-1 text-ink-soft">
                  {c.available === false ? t("notAvailable") : c.total && c.days ? t("total", { price: money(c.total, locale), days: c.days }) : t("from", { price: money(c.fromDaily, locale) })}
                </p>
                <span className="mt-2 inline-block font-semibold text-aegean">{c.total && c.available ? t("book") : t("view")}</span>
              </div>
            </a>
          ) : (
            <a href={c.href} className="block">
              <div className="relative aspect-[16/10] bg-stone">
                {c.photo && <Image src={c.photo} alt="" fill sizes="176px" unoptimized className="object-cover" />}
              </div>
              <div className="p-2.5 text-sm">
                <p className="font-semibold leading-tight">{c.title}</p>
                {c.note ? <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{c.note}</p> : <p className="mt-1 text-ink-soft">{c.year} · {c.mileageKm.toLocaleString(locale)} {t("km")}</p>}
                <p className="mt-1 font-semibold">{c.price ? money(c.price, locale) : t("onRequest")}</p>
              </div>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function DraftCard({ d, t, onDecide }: { d: Draft; t: T; onDecide: (a: "confirm" | "dismiss") => void }) {
  const kinds = { HANDOFF: t("kinds.HANDOFF"), RENTAL_CALLBACK: t("kinds.RENTAL_CALLBACK"), SALES_INQUIRY: t("kinds.SALES_INQUIRY"), TEST_DRIVE: t("kinds.TEST_DRIVE"), SERVICE_APPOINTMENT: t("kinds.SERVICE_APPOINTMENT") } as Record<string, string>;
  const rows: [string, string | null][] = [[t("draftName"), d.name], [t("draftPhone"), d.phone], [t("draftEmail"), d.email], [t("draftPreferred"), d.preferred], [t("draftDetails"), d.details]];
  return (
    <div className="rounded-xl border-2 border-aegean/30 bg-white p-3.5 text-sm">
      <p className="font-semibold">{t("draftTitle")}: {kinds[d.kind] ?? d.kind}</p>
      <dl className="mt-2 space-y-1">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-2">
            <dt className="text-ink-soft">{k}</dt>
            <dd className="break-words">{v}</dd>
          </div>
        ))}
      </dl>
      {d.state === "open" && (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => onDecide("confirm")} className="btn-primary flex-1 justify-center !py-2 text-sm">{t("confirm")}</button>
          <button type="button" onClick={() => onDecide("dismiss")} className="rounded-full border border-ink/15 px-4 py-2 font-semibold">{t("dismiss")}</button>
        </div>
      )}
      {d.state === undefined && <p className="mt-3 text-ink-soft">…</p>}
      {d.state === "sent" && <p className="mt-3 font-medium text-[#14653a]" role="status">{t("sent")}</p>}
      {d.state === "dismissed" && <p className="mt-3 text-ink-soft" role="status">{t("dismissed")}</p>}
      {d.state === "failed" && <p className="mt-3 text-red-700" role="alert">{t("sendFailed")}</p>}
    </div>
  );
}
