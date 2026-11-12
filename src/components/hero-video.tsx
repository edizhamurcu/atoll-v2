"use client";
import { useEffect, useRef } from "react";

/**
 * Desktop-only background loop for the home hero. The poster is a CSS background on the parent,
 * so nothing is downloaded on phones, with reduced motion, or with Save-Data; the video source is
 * attached only when all three allow it.
 */
export function HeroVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const wide = window.matchMedia("(min-width: 768px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const ok = wide.matches && !calm.matches && !conn?.saveData;
      if (ok && !v.src) { v.src = src; v.play().catch(() => {}); }
      else if (!ok && v.src) { v.pause(); v.removeAttribute("src"); v.load(); }
    };
    sync();
    wide.addEventListener("change", sync);
    calm.addEventListener("change", sync);
    return () => { wide.removeEventListener("change", sync); calm.removeEventListener("change", sync); };
  }, [src]);
  return <video ref={ref} className="absolute inset-0 size-full object-cover" muted loop playsInline preload="none" aria-hidden tabIndex={-1} />;
}
