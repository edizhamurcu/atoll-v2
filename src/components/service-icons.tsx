import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SERVICE_KINDS, type ServiceKindKey } from "@/content/service";
import { SERVICE_PAGES } from "@/content/car-service";

const circle = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0 ${r} ${r} 0 1 0-${2 * r} 0`;

/** Line icons (24px grid) drawn as recognisable workshop objects: engine, car body, spray gun, battery, car with water drops. */
const PATHS: Record<ServiceKindKey, string> = {
  MECHANICAL: "M3 11h2V9h2.5V7H11V5h5v2h2.5v2H21v7h-2.5v2H9l-2.5-2.5H5V14H3zM11 11h6M11 14h6M8 5h2",
  BODY: `M3 15.5v-3.2l1.9-4.6A2 2 0 0 1 6.8 6.5h10.4a2 2 0 0 1 1.9 1.2l1.9 4.6v3.2M3 15.5h18M5.5 12.3h13M12 7v5.3M3 15.5v2h3.2M17.8 17.5H21v-2 ${circle(7.6, 17.5, 1.6)} ${circle(16.4, 17.5, 1.6)}`,
  PAINT: "M3 6.5h9.5a2 2 0 0 1 2 2v2.5H3zM6 11v7a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-7M14.5 8.6h2.2M19 6.2h.01M19.5 8.6h.01M19 11h.01M17 13h.01",
  ELECTRICAL: "M3 8.5h15.5V19H3zM6.5 8.5V6h3v2.5M12.5 8.5V6h3v2.5M18.5 12h2.5v3.5h-2.5M10.6 10.8 8.4 14h3.2l-1.2 3 3.2-4h-3z",
  WASH: `M4 18.5v-3.2l1.6-3.7a1.8 1.8 0 0 1 1.7-1.1h7.4a1.8 1.8 0 0 1 1.7 1.1l1.6 3.7v3.2M4 15.5h16M4 18.5h16M7.5 15.5v.01M16.5 15.5v.01M8.5 3.2c.9 1.1 1.4 1.8 1.4 2.4a1.4 1.4 0 0 1-2.8 0c0-.6.5-1.3 1.4-2.4zM15.5 3.2c.9 1.1 1.4 1.8 1.4 2.4a1.4 1.4 0 0 1-2.8 0c0-.6.5-1.3 1.4-2.4z`,
};

const GLYPHS = {
  request: "M8 4h8a1 1 0 0 1 1 1v15H7V5a1 1 0 0 1 1-1zM10 3h4v2h-4zM9.5 10h5M9.5 13h5M9.5 16h3",
  ticket: "M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5V10a2 2 0 0 0 0 4v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 15.5V14a2 2 0 0 0 0-4zM14 7.5v9M9.5 10.5v3",
  calendar: "M5 6.5h14V19H5zM5 10h14M8.5 4.5v3M15.5 4.5v3M8.5 13h2M13.5 13h2M8.5 16h2",
  key: "M14.5 9.5a4 4 0 1 0-3.9 4.9L10.4 20H13v-2h2v-2h2.2l.8-1.1A4 4 0 0 0 14.5 9.5zM11.2 9.2h.01",
  car: "M3.5 15v-3l1.8-4.2A2 2 0 0 1 7.1 6.5h9.8a2 2 0 0 1 1.8 1.3L20.5 12v3M3.5 15h17v2.5h-3M6.5 17.5h-3V15M5.5 12h13",
  pin: "M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10zM12 8.5v5M9.5 11h5",
  shield: "M12 3.5 5 6v5.6c0 4.2 2.8 7.2 7 8.9 4.2-1.7 7-4.7 7-8.9V6zM8.8 12l2.3 2.3 4.2-4.6",
} as const;
export type GlyphName = keyof typeof GLYPHS;

export function Glyph({ name, className = "size-6" }: { name: GlyphName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={GLYPHS[name]} />
    </svg>
  );
}

export function ServiceIcon({ kind, className = "size-6" }: { kind: ServiceKindKey; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={PATHS[kind]} />
    </svg>
  );
}

/** Pill menu linking the five service pages (hub and detail pages); `current` marks the open page. */
export async function ServiceMenu({ current, className = "" }: { current?: string; className?: string }) {
  const t = await getTranslations("service");
  return (
    <nav aria-label={t("hubTitle")} className={`-mx-5 overflow-x-auto px-5 [scrollbar-width:none] ${className}`}>
      <ul className="flex w-max gap-2 rounded-full border border-ink/10 bg-white p-1.5 shadow-sm md:w-auto md:flex-wrap">
        {SERVICE_PAGES.map(({ slug, kind }) => {
          const on = slug === current;
          return (
            <li key={slug}>
              <Link href={`/car-service/${slug}`} aria-current={on ? "page" : undefined} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${on ? "bg-ink text-white" : "text-ink hover:bg-gold/25"}`}>
                <ServiceIcon kind={kind} className="size-5" />{t(`kinds.${kind}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The five OSK services as icon links to the service reservation form (home page and Car Sales page). */
export async function ServiceIconLinks({ className = "" }: { className?: string }) {
  const t = await getTranslations("service");
  return (
    <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-5 ${className}`}>
      {SERVICE_KINDS.map((k) => (
        <li key={k}>
          <Link href="/car-sales#service-request" className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-gold/40 bg-white px-3 py-4 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:border-gold hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2">
            <span className="grid size-11 place-items-center rounded-full bg-gold/20 text-ink transition group-hover:bg-gold"><ServiceIcon kind={k} /></span>
            {t(`kinds.${k}`)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
