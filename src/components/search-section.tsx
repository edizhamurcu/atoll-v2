import { getSearchOptions } from "@/server/queries";
import type { Locale } from "@/server/catalog";
import { SearchForm } from "./search-form";

export async function SearchSection({ locale, compact, target, stacked }: { locale: Locale; compact?: boolean; target?: string; stacked?: boolean }) {
  const options = await getSearchOptions(locale);
  return <SearchForm options={options} compact={compact} target={target} stacked={stacked} />;
}

export function SearchSkeleton() {
  return <div className="h-44 animate-pulse rounded-[var(--radius-panel)] bg-paper/70" aria-hidden />;
}
