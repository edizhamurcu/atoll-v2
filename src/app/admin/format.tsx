const TZ = process.env.BUSINESS_TZ ?? "Asia/Famagusta";
export const dt = (d: Date | string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(new Date(d));
export const tm = (d: Date | string) => new Intl.DateTimeFormat("tr-TR", { timeStyle: "short", timeZone: TZ }).format(new Date(d));
export const gbp = (v: { toString(): string } | number | string) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(v.toString()));
export const STATUS_TR: Record<string, string> = { HOLD: "Ayrıldı (ödeme ekranı)", PENDING_PAYMENT: "Ödeme bekliyor", CONFIRMED: "Onaylı", CANCELLED: "İptal", EXPIRED: "Süresi doldu", COMPLETED: "Tamamlandı", NO_SHOW: "Gelmedi" };
export const STATUS_TONE: Record<string, string> = { CONFIRMED: "bg-aegean-wash text-ink", PENDING_PAYMENT: "bg-amber-100 text-amber-900", HOLD: "bg-stone-deep text-ink", CANCELLED: "bg-red-50 text-alert", EXPIRED: "bg-stone-deep text-ink-soft", COMPLETED: "bg-ink text-white", NO_SHOW: "bg-red-100 text-alert" };
export function StatusBadge({ s }: { s: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[s] ?? ""}`}>{STATUS_TR[s] ?? s}</span>;
}
