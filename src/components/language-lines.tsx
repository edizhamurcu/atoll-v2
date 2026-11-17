import { LANGUAGE_LINES, telLink } from "@/lib/site";

/** Phone lines by spoken language, shown under the contact details (footer and contact page). Wraps cleanly on narrow screens. */
export function LanguageLines({ className = "" }: { className?: string }) {
  return (
    <ul className={`space-y-1.5 ${className}`}>
      {LANGUAGE_LINES.map((l) => (
        <li key={l.phone} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="min-w-[8.5rem] text-sm text-ink-soft">{l.label}</span>
          <a href={telLink(l.phone)} className="whitespace-nowrap font-semibold text-ink hover:text-bougain">{l.phone}</a>
        </li>
      ))}
    </ul>
  );
}
