"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};
/** Current year computed in the browser only (no time-dependent value during prerender). */
export function Year() {
  const year = useSyncExternalStore(noop, () => new Date().getFullYear(), () => null);
  return <span>{year ?? "2026"}</span>;
}
