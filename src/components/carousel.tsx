"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Horizontal card rail without a visible scrollbar: arrow buttons page through it on desktop,
 * touch swipe on phones, cards snap to the edge, faded edges show there is more, and a thin
 * progress bar shows the position. Children are the <li> cards (rendered on the server).
 */
export function Carousel({ heading, headingId, prevLabel, nextLabel, children }: {
  heading: ReactNode;
  headingId: string;
  prevLabel: string;
  nextLabel: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [s, setS] = useState({ prev: false, next: true, thumb: 1, pos: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      setS({
        prev: el.scrollLeft > 4,
        next: el.scrollLeft < max - 4,
        thumb: el.scrollWidth ? el.clientWidth / el.scrollWidth : 1,
        pos: max > 0 ? el.scrollLeft / max : 0,
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener("scroll", measure); };
  }, []);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  const scrollable = s.thumb < 0.999;
  const mask = s.prev && s.next
    ? "[mask-image:linear-gradient(to_right,transparent,#000_2.5rem,#000_calc(100%-2.5rem),transparent)]"
    : s.next
      ? "[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]"
      : s.prev
        ? "[mask-image:linear-gradient(to_right,transparent,#000_2.5rem)]"
        : "";
  const btn =
    "grid size-10 place-items-center rounded-full border border-ink/15 bg-paper text-ink transition hover:border-ink/40 hover:bg-white disabled:cursor-default disabled:opacity-35 disabled:hover:border-ink/15 disabled:hover:bg-paper";

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-end justify-between gap-4">
        {heading}
        {scrollable && (
          <div className="hidden gap-2 sm:flex">
            <button type="button" className={btn} onClick={() => page(-1)} disabled={!s.prev} aria-label={prevLabel}>
              <svg aria-hidden viewBox="0 0 16 16" className="size-4"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className={btn} onClick={() => page(1)} disabled={!s.next} aria-label={nextLabel}>
              <svg aria-hidden viewBox="0 0 16 16" className="size-4"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}
      </div>
      <ul
        ref={ref}
        className={`-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${mask}`}
      >
        {children}
      </ul>
      {scrollable && (
        <div aria-hidden className="mt-4 h-1 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-ink/60"
            style={{ width: `${Math.max(s.thumb * 100, 8)}%`, marginLeft: `${s.pos * (100 - Math.max(s.thumb * 100, 8))}%` }}
          />
        </div>
      )}
    </section>
  );
}
