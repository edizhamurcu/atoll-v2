import "server-only";
import { db } from "@/lib/db";
import type { VehicleClass } from "@/generated/prisma/client";
import { availabilityByModel } from "./availability";
import { computeQuote, PricingError } from "./pricing";
import { getSettings } from "./settings";
import { validateWindow } from "./booking";

export type Locale = "en" | "tr" | "de" | "ru";
export const t = (v: unknown, locale: Locale): string => {
  if (!v || typeof v !== "object") return typeof v === "string" ? v : "";
  const o = v as Record<string, string>;
  return o[locale] ?? o.en ?? Object.values(o)[0] ?? "";
};

export function serializeModel(m: Awaited<ReturnType<typeof listModels>>[number], locale: Locale) {
  return {
    slug: m.slug,
    name: `${m.make} ${m.model}`,
    make: m.make,
    model: m.model,
    class: m.class,
    bodyType: m.bodyType,
    transmission: m.transmission,
    fuel: m.fuel,
    seats: m.seats,
    doors: m.doors,
    bags: m.bags,
    airCon: m.airCon,
    engineLitres: m.engineLitres?.toString() ?? null,
    images: m.images,
    description: t(m.description, locale),
    dailyRate: m.dailyRate.toFixed(2),
    fleetSize: m._count.vehicles,
  };
}

export async function listModels(filter?: { class?: VehicleClass; slug?: string }) {
  return db.vehicleModel.findMany({
    where: { active: true, ...(filter?.class ? { class: filter.class } : {}), ...(filter?.slug ? { slug: filter.slug } : {}) },
    include: { seasonRates: { orderBy: { createdAt: "asc" } }, _count: { select: { vehicles: { where: { status: "ACTIVE" } } } } },
    orderBy: [{ sortOrder: "asc" }, { dailyRate: "asc" }],
  });
}

/** Search: every model with live availability and an all-in base quote for the dates. */
export async function search(params: { pickupAt: Date; returnAt: Date; pickupLocation: string; returnLocation: string; deliveryZone?: string | null; class?: VehicleClass; locale: Locale }) {
  const settings = await getSettings();
  validateWindow(settings, params.pickupAt, params.returnAt);
  const [models, pickup, ret, zone, discounts] = await Promise.all([
    listModels({ class: params.class }),
    db.location.findFirst({ where: { slug: params.pickupLocation, active: true } }),
    db.location.findFirst({ where: { slug: params.returnLocation, active: true } }),
    params.deliveryZone ? db.deliveryZone.findFirst({ where: { slug: params.deliveryZone, active: true } }) : null,
    db.durationDiscount.findMany({ where: { active: true } }),
  ]);
  if (!pickup || !ret) return { error: "LOCATION_NOT_FOUND" as const };
  const end = new Date(params.returnAt.getTime() + settings.bufferMinutes * 60_000);
  const avail = await availabilityByModel({ start: params.pickupAt, end }, models.map((m) => m.id));

  const results = models.map((m) => {
    let quote = null;
    try {
      quote = computeQuote({
        pickupAt: params.pickupAt,
        returnAt: params.returnAt,
        baseDailyRate: m.dailyRate.toString(),
        seasonRates: m.seasonRates.map((r) => ({ startDate: r.startDate.toISOString().slice(0, 10), endDate: r.endDate.toISOString().slice(0, 10), dailyRate: r.dailyRate.toString() })),
        discounts: discounts.map((d) => ({ minDays: d.minDays, percent: d.percent.toString() })),
        extras: [],
        pickupFee: pickup.pickupFee.toString(),
        returnFee: ret.returnFee.toString(),
        deliveryTiers: zone ? (zone.tiers as { minDays: number; fee: string }[]) : null,
        rules: settings,
      });
    } catch (e) {
      if (!(e instanceof PricingError)) throw e;
    }
    const a = avail.get(m.id) ?? { total: 0, available: 0 };
    return {
      ...serializeModel(m, params.locale),
      availability: { available: a.available > 0, count: a.available, total: a.total },
      quote: quote && { days: quote.days, total: quote.grandTotal, averageDaily: quote.averageDaily, deposit: quote.depositAmount, discountPercent: quote.discountPercent },
    };
  });
  results.sort((a, b) => Number(b.availability.available) - Number(a.availability.available));
  return { results, days: results.find((r) => r.quote)?.quote?.days ?? null, currency: settings.currency };
}
