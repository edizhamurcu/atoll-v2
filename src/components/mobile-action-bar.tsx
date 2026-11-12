"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";

type Labels = { find: string; whatsapp: string; waHref: string; waSaleHref: string };

/** Pages with their own bottom bar or a form that needs the whole screen. */
const HIDE = [/^\/cars\/[^/]+$/, /^\/booking(\/|$)/];

/**
 * Phones/tablets: "Find a car" + WhatsApp at the bottom of the screen. Appears after the first screen,
 * hides while scrolling down (reading) and comes back on scroll up. Not shown where another bar exists.
 */
function Bar({ l, path }: { l: Labels; path: string }) {
  const [show, setShow] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > last.current + 4;
      const up = y < last.current - 4;
      if (y < 480) setShow(false);
      else if (up) setShow(true);
      else if (down) setShow(false);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const sale = path.startsWith("/car-sales");
  return (
    <>
      <div aria-hidden className="h-20 lg:hidden" />
      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_-20px_rgba(13,52,64,.5)] backdrop-blur transition-transform duration-200 motion-reduce:transition-none lg:hidden ${show ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link href="/#search" tabIndex={show ? 0 : -1} className="btn-primary flex-1 justify-center !py-3">{l.find}</Link>
          <a href={sale ? l.waSaleHref : l.waHref} rel="noopener" tabIndex={show ? 0 : -1} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#1f8f4e]/30 bg-[#e8f5ed] px-4 py-3 font-semibold text-[#14653a]">
            <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.1.3.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3 0 .2 0 .8-.2 1.4Z" /></svg>
            {l.whatsapp}
          </a>
        </div>
      </div>
    </>
  );
}

function Gate({ l }: { l: Labels }) {
  const path = usePathname();
  if (HIDE.some((r) => r.test(path))) return null;
  return <Bar l={l} path={path} />;
}

export function MobileActionBar({ labels }: { labels: Labels }) {
  return (
    <Suspense fallback={null}>
      <Gate l={labels} />
    </Suspense>
  );
}
