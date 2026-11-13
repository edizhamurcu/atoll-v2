"use client";
import { useEffect } from "react";

/** Streamed content arrives after the browser tried to jump to #anchor; jump again once it is in the page. */
export function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, []);
  return null;
}
