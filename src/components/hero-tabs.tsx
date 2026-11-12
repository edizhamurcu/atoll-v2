"use client";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

/**
 * Hero switch between the two businesses: "Rent a car" (default, the search form) and
 * "Buy a car" (OSK Auto teaser). Both panels are server-rendered; only visibility changes.
 */
export function HeroTabs({ rentLabel, saleLabel, groupLabel, rent, sale }: {
  rentLabel: string;
  saleLabel: string;
  groupLabel: string;
  rent: ReactNode;
  sale: ReactNode;
}) {
  const [tab, setTab] = useState<"rent" | "sale">("rent");
  const id = useId();
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = tab === "rent" ? "sale" : "rent";
    setTab(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };
  const tabBtn = (t: "rent" | "sale", label: string) => {
    const on = tab === t;
    const active = t === "rent" ? "bg-bougain text-white shadow-md" : "bg-gold text-ink shadow-md";
    return (
      <button
        id={`${id}-tab-${t}`}
        type="button"
        role="tab"
        aria-selected={on}
        aria-controls={`${id}-panel-${t}`}
        tabIndex={on ? 0 : -1}
        onClick={() => setTab(t)}
        className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[0.95rem] font-bold transition-colors sm:px-6 ${on ? active : "text-ink-soft hover:text-ink"}`}
      >
        <span aria-hidden className={`size-2 rounded-full ${on ? (t === "rent" ? "bg-white" : "bg-ink") : t === "rent" ? "bg-bougain" : "bg-gold"}`} />
        {label}
      </button>
    );
  };
  return (
    <div>
      <div role="tablist" aria-label={groupLabel} onKeyDown={onKey} className="mb-4 inline-grid grid-cols-2 gap-1 rounded-full border border-ink/10 bg-paper p-1">
        {tabBtn("rent", rentLabel)}
        {tabBtn("sale", saleLabel)}
      </div>
      <div id={`${id}-panel-rent`} role="tabpanel" aria-labelledby={`${id}-tab-rent`} hidden={tab !== "rent"}>{rent}</div>
      <div id={`${id}-panel-sale`} role="tabpanel" aria-labelledby={`${id}-tab-sale`} hidden={tab !== "sale"} className="nav-pop">{sale}</div>
    </div>
  );
}
