"use client";
import { useEffect } from "react";

/** Streamed content arrives after the browser tried to jump to #anchor; jump again once it is in the page. */
export function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    // After fonts and late content settle, so the heading lands just under the sticky header.
    const go = () => document.getElementById(id)?.scrollIntoView({ block: "start" });
    const t = setTimeout(go, 250);
    return () => clearTimeout(t);
  }, []);
  return null;
}
