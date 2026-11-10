"use client";
import { Link, usePathname } from "@/i18n/navigation";

type Props = { rentLabel: string; saleLabel: string; variant?: "bar" | "cards" };

/** Rental (Atoll, red) vs. sales (OSK Auto, gold): two clearly separate segments in the header and mobile menu. */
export function CarSegments(props: Props) {
  const path = usePathname();
  const sale = path.startsWith("/car-sales");
  const rent = !sale && (path.startsWith("/cars") || path.startsWith("/car-prices") || path.startsWith("/booking"));
  return <CarSegmentsView {...props} rent={rent} sale={sale} />;
}

/** Same markup without route state: the Suspense fallback while the pathname is resolved. */
export function CarSegmentsView({ rentLabel, saleLabel, variant = "bar", rent = false, sale = false }: Props & { rent?: boolean; sale?: boolean }) {
  if (variant === "cards") {
    return (
      <div className="grid grid-cols-2 gap-3 py-4">
        <Link href="/cars" aria-current={rent ? "page" : undefined} className={`rounded-2xl border-2 px-4 py-3 font-semibold ${rent ? "border-bougain bg-bougain text-white" : "border-bougain/30 text-ink"}`}>
          <span className={`mb-1 block h-1.5 w-6 rounded-full ${rent ? "bg-white" : "bg-bougain"}`} aria-hidden />
          {rentLabel}
        </Link>
        <Link href="/car-sales" aria-current={sale ? "page" : undefined} className={`rounded-2xl border-2 px-4 py-3 font-semibold ${sale ? "border-gold bg-gold text-ink" : "border-gold/40 text-ink"}`}>
          <span className={`mb-1 block h-1.5 w-6 rounded-full ${sale ? "bg-ink" : "bg-gold"}`} aria-hidden />
          {saleLabel}
        </Link>
      </div>
    );
  }

  const base = "flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-colors";
  return (
    <div className="flex items-center rounded-full border border-ink/12 bg-paper/70 p-1 text-[0.9rem] font-medium">
      <Link href="/cars" aria-current={rent ? "page" : undefined} className={`${base} ${rent ? "bg-bougain text-white" : "text-ink-soft hover:bg-bougain/10 hover:text-ink"}`}>
        <span aria-hidden className={`size-2 rounded-full ${rent ? "bg-white" : "bg-bougain"}`} />
        {rentLabel}
      </Link>
      <Link href="/car-sales" aria-current={sale ? "page" : undefined} className={`${base} ${sale ? "bg-gold text-ink" : "text-ink-soft hover:bg-gold/15 hover:text-ink"}`}>
        <span aria-hidden className={`size-2 rounded-full ${sale ? "bg-ink" : "bg-gold"}`} />
        {saleLabel}
      </Link>
    </div>
  );
}
