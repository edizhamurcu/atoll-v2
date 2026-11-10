"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const BASE = "/media/video/atoll-about";

/** Muted, looping highlight of the Alsancak building (rental, showroom, workshop, car wash). Respects reduced motion. */
export function AboutVideo() {
  const t = useTranslations("about");
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false); // mirrors the element via onPlay/onPause

  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // no autoplay for reduced motion
    v.play().catch(() => {}); // autoplay may be blocked; the button still works
  }, []);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  return (
    <figure className="relative mt-8 overflow-hidden rounded-2xl bg-ink/5 shadow-sm">
      <video ref={ref} className="aspect-video w-full object-cover" muted loop playsInline preload="metadata" poster={`${BASE}-poster.webp`} aria-label={t("videoLabel")} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
        <source src={`${BASE}-1080.mp4`} type="video/mp4" media="(min-width: 900px)" />
        <source src={`${BASE}-720.mp4`} type="video/mp4" />
      </video>
      <button type="button" onClick={toggle} aria-pressed={!playing} className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-ink/85">
        {playing ? t("pause") : t("play")}
      </button>
    </figure>
  );
}
