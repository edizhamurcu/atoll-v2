"use client";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Suspense } from "react";

const NAMES: Record<string, string> = { en: "English", tr: "Türkçe", de: "Deutsch", ru: "Русский" };

function Switcher({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      {/* Phones: show only the language code so the brand logos get the room; the native list still shows full names. */}
      <span aria-hidden className="pointer-events-none rounded-full border border-ink/15 py-1.5 pl-3 pr-7 text-sm font-medium uppercase text-ink sm:hidden">{locale}</span>
      <select
        value={locale}
        onChange={(e) => {
          const qs = search.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: e.target.value });
        }}
        className="absolute inset-0 appearance-none rounded-full text-base opacity-0 sm:static sm:border sm:border-ink/15 sm:bg-transparent sm:py-1.5 sm:pl-3 sm:pr-7 sm:text-sm sm:font-medium sm:uppercase sm:text-ink sm:opacity-100 sm:hover:border-ink/40"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>{NAMES[l]}</option>
        ))}
      </select>
      <svg aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-ink-soft" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
    </label>
  );
}

export function LocaleSwitcher({ label }: { label: string }) {
  return (
    <Suspense fallback={<span className="inline-block h-8 w-14" />}>
      <Switcher label={label} />
    </Suspense>
  );
}
