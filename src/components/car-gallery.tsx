"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CarImage } from "./car-image";

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Model photos: swipeable main track (scroll-snap) with arrows and counter, thumbnail rail without a
 * scrollbar, and a fullscreen viewer (native <dialog>: Esc closes, focus is trapped) with tap-to-zoom.
 */
export function CarGallery({ images, alt }: { images: string[]; alt: string }) {
  const t = useTranslations("car");
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const n = images.length;

  // Keep the counter / thumbnails in sync with swipes on the main track.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setI(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Active thumbnail stays visible.
  useEffect(() => {
    const li = thumbs.current?.children[i] as HTMLElement | undefined;
    li?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
  }, [i]);

  if (n === 0) return <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)]"><CarImage alt={alt} sizes="60vw" /></div>;

  const goTo = (k: number) => {
    const el = track.current;
    if (!el) return;
    const idx = (k + n) % n;
    el.scrollTo({ left: idx * el.clientWidth, behavior: reduceMotion() ? "auto" : "smooth" });
  };
  const openViewer = () => { setOpen(true); dialog.current?.showModal(); };

  return (
    <div>
      <div className="relative">
        <div
          ref={track}
          className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[var(--radius-panel)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          tabIndex={n > 1 ? 0 : -1}
          role="group"
          aria-roledescription="carousel"
          aria-label={t("photo", { n: i + 1, total: n })}
          onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); goTo(i + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); goTo(i - 1); } }}
        >
          {images.map((src, k) => (
            <button
              key={src}
              type="button"
              onClick={openViewer}
              aria-label={`${t("fullscreen")} — ${t("photo", { n: k + 1, total: n })}`}
              className="relative h-full w-full shrink-0 snap-center cursor-zoom-in"
            >
              <Image src={src} alt={`${alt} — ${t("photo", { n: k + 1, total: n })}`} fill sizes="(min-width:1024px) 60vw, 100vw" priority={k === 0} loading={k === 0 ? undefined : "lazy"} className="object-contain" />
            </button>
          ))}
        </div>
        {n > 1 && (
          <>
            <button type="button" onClick={() => goTo(i - 1)} aria-label={t("prevPhoto")} className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 shadow hover:bg-paper sm:flex">
              <svg aria-hidden viewBox="0 0 16 16" className="size-4"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={() => goTo(i + 1)} aria-label={t("nextPhoto")} className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 shadow hover:bg-paper sm:flex">
              <svg aria-hidden viewBox="0 0 16 16" className="size-4"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </>
        )}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2">
          {n > 1 && <span className="rounded-full bg-ink/75 px-2.5 py-1 text-xs text-white tabular-nums">{i + 1} / {n}</span>}
          <span className="rounded-full bg-ink/75 p-1.5 text-white" aria-hidden>
            <svg viewBox="0 0 16 16" className="size-3.5"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </div>
      </div>

      {n > 1 && (
        <ul ref={thumbs} className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((src, k) => (
            <li key={src} className="shrink-0">
              <button type="button" onClick={() => goTo(k)} aria-label={t("photo", { n: k + 1, total: n })} aria-current={k === i}
                className={`relative block aspect-[4/3] w-20 overflow-hidden rounded-lg ring-2 transition sm:w-24 ${k === i ? "ring-bougain" : "opacity-70 ring-transparent hover:opacity-100 hover:ring-ink/30"}`}>
                <Image src={src} alt="" fill sizes="96px" className="object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        onClose={() => { setOpen(false); goTo(i); }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-white backdrop:bg-ink"
        aria-label={alt}
      >
        {open && <Viewer images={images} alt={alt} start={i} onIndex={setI} onClose={() => dialog.current?.close()} />}
      </dialog>
    </div>
  );
}

function Viewer({ images, alt, start, onIndex, onClose }: { images: string[]; alt: string; start: number; onIndex: (k: number) => void; onClose: () => void }) {
  const t = useTranslations("car");
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(start);
  const [zoom, setZoom] = useState(false);
  const n = images.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = start * el.clientWidth;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onScroll = () => { const idx = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)); setK(idx); onIndex(idx); };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); root.style.overflow = prev; };
  }, [start, onIndex]);

  const go = (d: number) => {
    const el = ref.current;
    if (!el) return;
    setZoom(false);
    el.scrollTo({ left: ((k + d + n) % n) * el.clientWidth, behavior: reduceMotion() ? "auto" : "smooth" });
  };

  return (
    <div
      className="relative flex h-full flex-col"
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
    >
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
        <span className="text-sm tabular-nums text-white/80">{k + 1} / {n}</span>
        <span className="hidden text-sm text-white/60 sm:block">{t("zoomHint")}</span>
        <button type="button" onClick={onClose} autoFocus aria-label={t("closeGallery")} className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
          <svg aria-hidden viewBox="0 0 16 16" className="size-4"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>
      <div
        ref={ref}
        className={`flex flex-1 snap-x snap-mandatory overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${zoom ? "overflow-hidden" : "overflow-x-auto"}`}
      >
        {images.map((src, idx) => (
          <div key={src} className={`relative h-full w-full shrink-0 snap-center ${zoom && idx === k ? "overflow-auto" : "overflow-hidden"}`}>
            <button
              type="button"
              onClick={() => setZoom((z) => !z)}
              aria-label={t("zoomHint")}
              className={`relative block ${zoom && idx === k ? "h-[200%] w-[200%] cursor-zoom-out" : "h-full w-full cursor-zoom-in"}`}
            >
              <Image src={src} alt={`${alt} — ${t("photo", { n: idx + 1, total: n })}`} fill sizes={zoom && idx === k ? "200vw" : "100vw"} className="object-contain" />
            </button>
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label={t("prevPhoto")} className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid">
            <svg aria-hidden viewBox="0 0 16 16" className="size-5"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" onClick={() => go(1)} aria-label={t("nextPhoto")} className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid">
            <svg aria-hidden viewBox="0 0 16 16" className="size-5"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </>
      )}
    </div>
  );
}
