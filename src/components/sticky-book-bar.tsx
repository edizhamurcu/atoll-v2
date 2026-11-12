"use client";
import { useEffect, useState } from "react";

/**
 * Phones/tablets only: a bottom bar with the daily price and a "Book" button while the booking panel
 * (#book) is still below the screen. It hides as soon as the panel scrolls into view (or is passed),
 * so it never covers the form or the footer.
 */
export function StickyBookBar({ price, label, cta }: { price: string; label: string; cta: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const target = document.getElementById("book");
    if (!target) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top > 0), { threshold: 0 });
    io.observe(target);
    return () => io.disconnect();
  }, []);
  const go = () => {
    const el = document.getElementById("book");
    el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_-20px_rgba(13,52,64,.5)] backdrop-blur transition-transform duration-200 motion-reduce:transition-none lg:hidden ${show ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="min-w-0 leading-tight">
          <span className="block font-display text-xl font-extrabold">{price}</span>
          <span className="text-xs text-ink-soft">{label}</span>
        </p>
        <button type="button" onClick={go} tabIndex={show ? 0 : -1} className="btn-primary shrink-0 !px-6 !py-3">{cta}</button>
      </div>
    </div>
  );
}
