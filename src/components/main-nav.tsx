"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Main navigation: rental (Atoll, red) and sales (OSK Auto, gold) are two separate groups,
 * each with its own panel; About, Discover and Contact stay outside both brands.
 * The *View components take the pathname as a prop so they can render as Suspense
 * fallbacks while usePathname() resolves (cacheComponents prerender).
 */

export type NavLabels = Record<
  | "rentCars" | "carSales" | "aboutUs" | "contactUs" | "carPrices" | "rentalTerms" | "specialOffers" | "agreement"
  | "guide" | "drivingSouth" | "blog" | "home" | "menu" | "close" | "discover" | "rentPitch" | "rentCta" | "fleet"
  | "fleetDesc" | "pricesDesc" | "termsDesc" | "offersDesc" | "agreementDesc" | "salePitch" | "saleCta" | "showroom"
  | "showroomDesc" | "stock" | "stockDesc" | "service" | "serviceDesc" | "whatsapp" | "guideDesc" | "southDesc"
  | "blogDesc" | "call" | "general" | "rentGroup" | "saleGroup" | "phone" | "telHref" | "waHref" | "waSaleHref",
  string
>;

type Group = "rent" | "sale" | "discover";
type Item = { href: string; title: string; desc?: string; icon: IconName; external?: boolean };

const RENT_IMG = "/media/2026/08/image_2026-08-24_143333064-atoll-r2.webp";
const SALE_IMG = "/media/osk/showroom-mercedes.webp";
const RENT_PATHS = ["/cars", "/car-prices", "/booking", "/rental-terms", "/special-offers", "/rental-agreement"];
const DISCOVER_PATHS = ["/north-cyprus-guide", "/driving-in-south-cyprus", "/blog"];
const under = (path: string, bases: string[]) => bases.some((b) => path === b || path.startsWith(`${b}/`));

function activeGroup(path: string | null): Group | "about" | "contact" | null {
  if (!path) return null;
  if (under(path, ["/car-sales"])) return "sale";
  if (under(path, RENT_PATHS)) return "rent";
  if (under(path, DISCOVER_PATHS)) return "discover";
  if (under(path, ["/about-us"])) return "about";
  if (under(path, ["/contact"])) return "contact";
  return null;
}

function items(l: NavLabels) {
  const rent: Item[] = [
    { href: "/cars", title: l.fleet, desc: l.fleetDesc, icon: "car" },
    { href: "/car-prices", title: l.carPrices, desc: l.pricesDesc, icon: "tag" },
    { href: "/rental-terms", title: l.rentalTerms, desc: l.termsDesc, icon: "shield" },
    { href: "/special-offers", title: l.specialOffers, desc: l.offersDesc, icon: "spark" },
    { href: "/rental-agreement", title: l.agreement, desc: l.agreementDesc, icon: "doc" },
  ];
  const sale: Item[] = [
    { href: "/car-sales#gallery", title: l.showroom, desc: l.showroomDesc, icon: "store" },
    { href: "/car-sales#stock", title: l.stock, desc: l.stockDesc, icon: "search" },
    { href: "/car-sales#after", title: l.service, desc: l.serviceDesc, icon: "wrench" },
    { href: l.waSaleHref, title: l.whatsapp, desc: l.phone, icon: "chat", external: true },
  ];
  const discover: Item[] = [
    { href: "/north-cyprus-guide", title: l.guide, desc: l.guideDesc, icon: "map" },
    { href: "/driving-in-south-cyprus", title: l.drivingSouth, desc: l.southDesc, icon: "route" },
    { href: "/blog", title: l.blog, desc: l.blogDesc, icon: "pen" },
  ];
  return { rent, sale, discover };
}

/* ---------- desktop ---------- */

export function MainNav({ labels }: { labels: NavLabels }) {
  return <MainNavView labels={labels} path={usePathname()} />;
}

export function MainNavView({ labels: l, path }: { labels: NavLabels; path: string | null }) {
  const [open, setOpen] = useState<Group | null>(null);
  const ref = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverAt = useRef(0);
  const id = useId();
  const active = activeGroup(path);
  const { rent, sale, discover } = items(l);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(null); };
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const cancel = () => { if (timer.current) clearTimeout(timer.current); };
  const enter = (e: RPointerEvent, g: Group) => {
    if (e.pointerType !== "mouse") return;
    cancel();
    if (open !== g) hoverAt.current = Date.now();
    setOpen(g);
  };
  const leave = (e: RPointerEvent) => {
    if (e.pointerType !== "mouse") return;
    cancel();
    timer.current = setTimeout(() => setOpen(null), 160);
  };
  const close = () => setOpen(null);

  const trigger = (g: Group, label: string, dot?: string) => {
    const isOpen = open === g;
    const isActive = active === g;
    const tone = g === "rent" ? "bougain" : g === "sale" ? "gold" : "ink";
    const on =
      tone === "bougain" ? "bg-bougain text-white" : tone === "gold" ? "bg-gold text-ink" : "bg-ink text-white";
    const idle =
      tone === "bougain" ? "text-ink hover:bg-bougain/10" : tone === "gold" ? "text-ink hover:bg-gold/20" : "text-ink-soft hover:bg-ink/5 hover:text-ink";
    return (
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`${id}-${g}`}
        onClick={() => {
          // A mouse hover has just opened this panel: the click that follows must not close it again.
          if (isOpen && Date.now() - hoverAt.current < 600) return;
          setOpen(isOpen ? null : g);
        }}
        className={`flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-semibold transition-colors ${isOpen || isActive ? on : idle}`}
      >
        {dot && <span aria-hidden className={`size-2 rounded-full ${isOpen || isActive ? (tone === "gold" ? "bg-ink" : "bg-white") : dot}`} />}
        {label}
        <svg aria-hidden viewBox="0 0 12 12" className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`}><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
      </button>
    );
  };

  const plain = (href: string, label: string, key: "about" | "contact") => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={`relative whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors hover:bg-ink/5 hover:text-ink ${active === key ? "text-ink after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-ink" : "text-ink-soft"}`}
    >
      {label}
    </Link>
  );

  return (
    <nav ref={ref} aria-label="Main" className="relative ml-auto hidden items-center gap-1 lg:flex">
      <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-paper/70 p-1" onPointerLeave={leave}>
        <div onPointerEnter={(e) => enter(e, "rent")}>{trigger("rent", l.rentCars, "bg-bougain")}</div>
        <div onPointerEnter={(e) => enter(e, "sale")}>{trigger("sale", l.carSales, "bg-gold")}</div>
        <Panel id={`${id}-rent`} open={open === "rent"} label={l.rentGroup} onEnter={cancel}>
          <Feature tone="rent" href="/#search" brand="Atoll Rent A Car" pitch={l.rentPitch} cta={l.rentCta} img={RENT_IMG} onPick={close} />
          <ItemList items={rent} tone="rent" onPick={close} />
        </Panel>
        <Panel id={`${id}-sale`} open={open === "sale"} label={l.saleGroup} onEnter={cancel}>
          <Feature tone="sale" href="/car-sales" brand="OSK Auto by Karaçay" pitch={l.salePitch} cta={l.saleCta} img={SALE_IMG} onPick={close} />
          <ItemList items={sale} tone="sale" onPick={close} />
        </Panel>
      </div>

      <span aria-hidden className="mx-1 h-6 w-px bg-ink/12" />
      {plain("/about-us", l.aboutUs, "about")}
      <div className="relative" onPointerEnter={(e) => enter(e, "discover")} onPointerLeave={leave}>
        {trigger("discover", l.discover)}
        <div
          id={`${id}-discover`}
          hidden={open !== "discover"}
          onPointerEnter={cancel}
          className="absolute right-0 top-full z-40 w-80 pt-3"
        >
          <div className="nav-pop rounded-[1.5rem] bg-paper p-2 shadow-[0_24px_60px_-24px_rgba(13,52,64,.45)] ring-1 ring-ink/5">
            <ItemList items={discover} tone="discover" onPick={close} />
          </div>
        </div>
      </div>
      {plain("/contact", l.contactUs, "contact")}
    </nav>
  );
}

function Panel({ id, open, label, onEnter, children }: { id: string; open: boolean; label: string; onEnter: () => void; children: ReactNode }) {
  return (
    <div id={id} role="region" aria-label={label} hidden={!open} onPointerEnter={onEnter} className="absolute left-1/2 top-full z-40 w-[min(46rem,calc(100vw-2.5rem))] -translate-x-1/2 pt-3">
      <div className="nav-pop grid grid-cols-[17rem_1fr] gap-2 rounded-[1.75rem] bg-paper p-2 shadow-[0_24px_60px_-24px_rgba(13,52,64,.45)] ring-1 ring-ink/5">
        {children}
      </div>
    </div>
  );
}

function Feature({ tone, href, brand, pitch, cta, img, onPick, compact }: {
  tone: "rent" | "sale"; href: string; brand: string; pitch: string; cta: string; img: string; onPick: () => void; compact?: boolean;
}) {
  const rent = tone === "rent";
  return (
    <Link
      href={href}
      onClick={onPick}
      className={`group relative flex overflow-hidden rounded-[1.4rem] p-5 ${rent ? "bg-bougain text-white" : "bg-gold text-ink"} ${compact ? "min-h-0 flex-row items-center gap-4" : "min-h-full flex-col"}`}
    >
      <div className={compact ? "min-w-0 flex-1" : ""}>
        <p className={`text-sm font-semibold ${rent ? "text-white/80" : "text-ink/70"}`}>{brand}</p>
        <p className={`mt-1 font-bold leading-snug ${compact ? "text-base" : "text-lg"}`}>{pitch}</p>
        <span className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${rent ? "bg-white text-bougain" : "bg-ink text-white"}`}>
          {cta}
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 transition-transform motion-safe:group-hover:translate-x-0.5"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </div>
      <Image
        src={img}
        alt=""
        width={1600}
        height={1200}
        sizes={compact ? "112px" : "240px"}
        loading="eager"
        fetchPriority="low"
        className={`rounded-2xl object-cover shadow-lg transition-transform duration-500 ${compact ? "aspect-[4/3] w-28 shrink-0 rotate-2" : "mt-auto aspect-[4/3] w-full translate-y-3 rotate-[-2deg] motion-safe:group-hover:translate-y-1 motion-safe:group-hover:rotate-0"}`}
      />
    </Link>
  );
}

function ItemList({ items, tone, onPick }: { items: Item[]; tone: Group; onPick: () => void }) {
  const tile = tone === "rent" ? "bg-bougain/10 text-bougain" : tone === "sale" ? "bg-gold/20 text-[#7a6224]" : "bg-aegean-wash text-aegean";
  return (
    <ul className="grid content-start gap-0.5">
      {items.map((it) => {
        const body = (
          <>
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl transition-transform motion-safe:group-hover:-rotate-6 ${tile}`}><Icon name={it.icon} /></span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink">{it.title}</span>
              {it.desc && <span className="block text-sm leading-snug text-ink-soft">{it.desc}</span>}
            </span>
          </>
        );
        const cls = "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-stone focus-visible:bg-stone";
        return (
          <li key={it.href}>
            {it.external ? (
              <a href={it.href} target="_blank" rel="noopener" onClick={onPick} className={cls}>{body}</a>
            ) : (
              <Link href={it.href} onClick={onPick} className={cls}>{body}</Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- mobile ---------- */

export function MobileMenu({ labels }: { labels: NavLabels }) {
  return <MobileMenuView labels={labels} path={usePathname()} />;
}

export function MobileMenuView({ labels: l, path }: { labels: NavLabels; path: string | null }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<"rent" | "sale" | null>(null);
  const id = useId();
  const active = activeGroup(path);
  const tab = picked ?? (active === "sale" ? "sale" : "rent");
  const { rent, sale, discover } = items(l);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { root.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open]);

  const close = () => setOpen(false);
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = tab === "rent" ? "sale" : "rent";
    setPicked(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };
  const tabBtn = (t: "rent" | "sale", label: string) => {
    const sel = tab === t;
    const on = t === "rent" ? "bg-bougain text-white shadow-md" : "bg-gold text-ink shadow-md";
    return (
      <button
        id={`${id}-tab-${t}`}
        type="button"
        role="tab"
        aria-selected={sel}
        aria-controls={`${id}-panel`}
        tabIndex={sel ? 0 : -1}
        onClick={() => setPicked(t)}
        className={`flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-[0.95rem] font-bold transition-colors ${sel ? on : "text-ink-soft"}`}
      >
        <span aria-hidden className={`size-2 rounded-full ${sel ? (t === "rent" ? "bg-white" : "bg-ink") : t === "rent" ? "bg-bougain" : "bg-gold"}`} />
        {label}
      </button>
    );
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        aria-label={open ? l.close : l.menu}
        onClick={() => setOpen(!open)}
        className={`flex size-11 items-center justify-center rounded-full border transition-colors ${open ? "border-ink bg-ink text-white" : "border-ink/15"}`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-5">
          {open ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : <path d="M4 7h16M4 12h10M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
        </svg>
      </button>

      <div id={`${id}-menu`} hidden={!open} className="absolute inset-x-0 top-full z-40 flex h-[calc(100dvh-4.75rem)] flex-col border-t border-ink/8 bg-stone">
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
          <div role="tablist" aria-label={l.menu} onKeyDown={onTabKey} className="grid grid-cols-2 gap-1 rounded-full border border-ink/10 bg-paper p-1">
            {tabBtn("rent", l.rentCars)}
            {tabBtn("sale", l.carSales)}
          </div>

          <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} className="nav-pop mt-4 space-y-2" key={tab}>
            {tab === "rent" ? (
              <Feature compact tone="rent" href="/#search" brand="Atoll Rent A Car" pitch={l.rentPitch} cta={l.rentCta} img={RENT_IMG} onPick={close} />
            ) : (
              <Feature compact tone="sale" href="/car-sales" brand="OSK Auto by Karaçay" pitch={l.salePitch} cta={l.saleCta} img={SALE_IMG} onPick={close} />
            )}
            <div className="rounded-[1.5rem] bg-paper p-1.5">
              <ItemList items={tab === "rent" ? rent : sale} tone={tab} onPick={close} />
            </div>
          </div>

          <h2 className="mt-6 px-2 text-sm font-semibold text-ink-soft">{l.general}</h2>
          <div className="mt-2 rounded-[1.5rem] bg-paper p-1.5">
            <ItemList
              items={[
                { href: "/about-us", title: l.aboutUs, icon: "info" },
                ...discover.map((it) => ({ ...it, desc: undefined })),
                { href: "/contact", title: l.contactUs, icon: "mail" },
              ]}
              tone="discover"
              onPick={close}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-ink/10 bg-paper px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <a href={l.telHref} className="btn-primary !py-3 text-sm">
            <Icon name="phone" /> {l.call}
          </a>
          <a href={l.waHref} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-paper py-3 text-sm font-bold text-ink">
            <Icon name="chat" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- icons ---------- */

type IconName = "car" | "tag" | "shield" | "spark" | "doc" | "store" | "search" | "wrench" | "chat" | "map" | "route" | "pen" | "info" | "mail" | "phone";
const PATHS: Record<IconName, string> = {
  car: "M5 16.5V13l2-5h10l2 5v3.5M5 16.5h14M5 16.5v2M19 16.5v2M7.5 13h9M8 16.5a.01.01 0 1 0 0 0M16 16.5a.01.01 0 1 0 0 0",
  tag: "M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5zM8 8.5h.01",
  shield: "M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6zM9 12l2 2 4-4",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  doc: "M7 3.5h7l4 4v13H7zM14 3.5v4h4M9.5 12h6M9.5 15.5h6",
  store: "M4 9.5 5.5 4h13L20 9.5M4 9.5v10h16v-10M4 9.5h16M9 19.5v-5h6v5",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20",
  wrench: "M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 1-2-2zM14.5 6.5l3-3",
  chat: "M4.5 19.5l1.2-3.6A7.5 7.5 0 1 1 8.6 18.6zM9 11.5h.01M12 11.5h.01M15 11.5h.01",
  map: "M9 4.5 4 6.5v13l5-2 6 2 5-2v-13l-5 2zM9 4.5v13M15 6.5v13",
  route: "M6 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 16.5h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16",
  pen: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  info: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 11v5M12 8h.01",
  mail: "M4 6h16v12H4zM4.5 6.5 12 12.5l7.5-6",
  phone: "M5 4h3.5l1.5 4-2 1.5a10 10 0 0 0 6.5 6.5l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4z",
};
function Icon({ name }: { name: IconName }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}
