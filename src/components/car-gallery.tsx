"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CarImage } from "./car-image";

/** All photos of the model (every plate), main image + thumbnails; arrow keys switch photos. */
export function CarGallery({ images, alt }: { images: string[]; alt: string }) {
  const t = useTranslations("car");
  const [i, setI] = useState(0);
  if (images.length === 0) return <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)]"><CarImage alt={alt} sizes="60vw" /></div>;
  const go = (d: number) => setI((x) => (x + d + images.length) % images.length);
  return (
    <div>
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)]"
        tabIndex={images.length > 1 ? 0 : -1}
        role="group"
        aria-roledescription="carousel"
        aria-label={t("photo", { n: i + 1, total: images.length })}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
      >
        <Image key={images[i]} src={images[i]} alt={`${alt} — ${t("photo", { n: i + 1, total: images.length })}`} fill sizes="(min-width:1024px) 60vw, 100vw" priority={i === 0} className="object-contain" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t("prevPhoto")} className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 shadow hover:bg-paper">‹</button>
            <button type="button" onClick={() => go(1)} aria-label={t("nextPhoto")} className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 shadow hover:bg-paper">›</button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/75 px-2.5 py-1 text-xs text-white tabular-nums">{i + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, n) => (
            <li key={src} className="shrink-0">
              <button type="button" onClick={() => setI(n)} aria-label={t("photo", { n: n + 1, total: images.length })} aria-current={n === i}
                className={`relative block aspect-[4/3] w-24 overflow-hidden rounded-lg ring-2 ${n === i ? "ring-bougain" : "ring-transparent hover:ring-ink/30"}`}>
                <Image src={src} alt="" fill sizes="96px" className="object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
