import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SERVICE_KINDS, type ServiceKindKey } from "@/content/service";

const PATHS: Record<ServiceKindKey, string> = {
  MECHANICAL: "M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 1-2-2zM14.5 6.5l3-3",
  BODY: "M4.5 15.5 6 10.6A2 2 0 0 1 7.9 9.2h8.2a2 2 0 0 1 1.9 1.4l1.5 4.9M3.5 15.5h17V19h-17zM7 19v1.6M17 19v1.6M7.5 15.5h.01M16.5 15.5h.01",
  PAINT: "M5 4h11v5H5zM16 6.5h3V11h-8v3M11 14v6.5",
  ELECTRICAL: "M13 3 5.5 13.5H11L10 21l7.5-10.5H12z",
  WASH: "M12 3.5c3 3.8 5 6.3 5 9a5 5 0 0 1-10 0c0-2.7 2-5.2 5-9zM9.8 13.5a2.4 2.4 0 0 0 1.7 2",
};

export function ServiceIcon({ kind, className = "size-6" }: { kind: ServiceKindKey; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={PATHS[kind]} />
    </svg>
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
