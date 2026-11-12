"use client";
import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/search-params";

/**
 * Shows an amount and, when it changes, counts from the old value to the new one (~0.4 s) so the visitor
 * notices the update. Timers rather than requestAnimationFrame, so it also settles in webviews that do not
 * paint frames; no animation with prefers-reduced-motion.
 */
export function AnimatedMoney({ value, locale, className }: { value: string; locale: string; className?: string }) {
  const target = Number(value);
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    from.current = target;
    if (start === target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = reduce ? 1 : 16;
    let i = 0;
    const id = setInterval(() => {
      i++;
      const k = i / steps;
      setShown(i >= steps ? target : start + (target - start) * (1 - (1 - k) ** 3));
      if (i >= steps) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [target]);
  return <span className={`tabular-nums ${className ?? ""}`}>{money(shown.toFixed(2), locale)}</span>;
}
