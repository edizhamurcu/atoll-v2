import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { BUSINESS_TZ } from "./contact";

export interface SearchState {
  pickupLocation: string;
  returnLocation: string;
  pickupDate: string; // YYYY-MM-DD (business TZ)
  pickupTime: string; // HH:mm
  returnDate: string;
  returnTime: string;
  deliveryZone: string | null;
}

export const toIso = (date: string, time: string) => fromZonedTime(`${date}T${time}:00`, BUSINESS_TZ).toISOString();

export function stateToQuery(s: SearchState) {
  const q = new URLSearchParams({
    pickupLocation: s.pickupLocation,
    returnLocation: s.returnLocation,
    pickupAt: toIso(s.pickupDate, s.pickupTime),
    returnAt: toIso(s.returnDate, s.returnTime),
  });
  if (s.deliveryZone) q.set("deliveryZone", s.deliveryZone);
  return q;
}

export function queryToState(q: URLSearchParams): SearchState | null {
  const p = q.get("pickupAt"), r = q.get("returnAt"), loc = q.get("pickupLocation");
  if (!p || !r || !loc) return null;
  const pd = new Date(p), rd = new Date(r);
  if (Number.isNaN(pd.getTime()) || Number.isNaN(rd.getTime())) return null;
  return {
    pickupLocation: loc,
    returnLocation: q.get("returnLocation") ?? loc,
    pickupDate: formatInTimeZone(pd, BUSINESS_TZ, "yyyy-MM-dd"),
    pickupTime: formatInTimeZone(pd, BUSINESS_TZ, "HH:mm"),
    returnDate: formatInTimeZone(rd, BUSINESS_TZ, "yyyy-MM-dd"),
    returnTime: formatInTimeZone(rd, BUSINESS_TZ, "HH:mm"),
    deliveryZone: q.get("deliveryZone"),
  };
}

export function defaultState(firstLocation: string): SearchState {
  const now = Date.now();
  const p = new Date(now + 2 * 86_400_000), r = new Date(now + 9 * 86_400_000);
  return {
    pickupLocation: firstLocation,
    returnLocation: firstLocation,
    pickupDate: formatInTimeZone(p, BUSINESS_TZ, "yyyy-MM-dd"),
    pickupTime: "10:00",
    returnDate: formatInTimeZone(r, BUSINESS_TZ, "yyyy-MM-dd"),
    returnTime: "10:00",
    deliveryZone: null,
  };
}

export const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

export const money = (v: string | number, locale: string) =>
  new Intl.NumberFormat(locale === "en" ? "en-GB" : locale, { style: "currency", currency: "GBP", maximumFractionDigits: Number(v) % 1 ? 2 : 0 }).format(Number(v));
