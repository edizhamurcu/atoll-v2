"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

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
            <WhatsAppIcon />
            {l.whatsapp}
          </a>
        </div>
      </div>
    </>
  );
}

/** Round WhatsApp button, bottom-right on every page; on phones it sits above the bottom bars. */
function Floating({ l, path }: { l: Labels; path: string }) {
  const sale = path.startsWith("/car-sales");
  return (
    <a
      href={sale ? l.waSaleHref : l.waHref}
      target="_blank"
      rel="noopener"
      aria-label={l.whatsapp}
      title={l.whatsapp}
      className="fixed bottom-24 right-4 z-20 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-8px_rgba(13,52,64,.55)] transition-transform hover:scale-105 motion-reduce:transition-none lg:bottom-6 lg:right-6"
    >
      <WhatsAppIcon className="size-8" />
    </a>
  );
}

function Gate({ l }: { l: Labels }) {
  const path = usePathname();
  return (
    <>
      <Floating l={l} path={path} />
      {!HIDE.some((r) => r.test(path)) && <Bar l={l} path={path} />}
    </>
  );
}

export function MobileActionBar({ labels }: { labels: Labels }) {
  return (
    <Suspense fallback={null}>
      <Gate l={labels} />
    </Suspense>
  );
}
