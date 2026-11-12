"use client";
import { useEffect } from "react";

/**
 * Fades [data-reveal] elements in as they scroll into view. Marks <html class="reveal-on"> first, so without
 * JavaScript (or IntersectionObserver) nothing is ever hidden. Watches the DOM for streamed/navigated content.
 */
export function RevealObserver() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    const scan = (root: ParentNode) => root.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    document.documentElement.classList.add("reveal-on");
    scan(document);
    const mo = new MutationObserver((muts) => { for (const m of muts) m.addedNodes.forEach((n) => n instanceof Element && (n.matches("[data-reveal]") ? io.observe(n) : scan(n))); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}
