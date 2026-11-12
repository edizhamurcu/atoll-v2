import "server-only";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { listModels, serializeModel, t, type Locale } from "./catalog";

/** Request-time loaders for Server Components (DB is not available at build time). */
export async function getSearchOptions(locale: Locale) {
  await connection();
  const [locations, zones] = await Promise.all([
    db.location.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.deliveryZone.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return {
    locations: locations.map((l) => ({ slug: l.slug, name: t(l.name, locale), isAirport: l.isAirport, pickupFee: l.pickupFee.toFixed(2) })),
    zones: zones.map((z) => ({ slug: z.slug, name: z.name, areas: z.areas })),
  };
}

export async function getFleet(locale: Locale) {
  await connection();
  return (await listModels()).map((m) => serializeModel(m, locale));
}

export async function getModel(slug: string, locale: Locale) {
  await connection();
  const [m] = await listModels({ slug });
  return m ? serializeModel(m, locale) : null;
}

export async function getExtras(locale: Locale) {
  await connection();
  const rows = await db.extra.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((x) => ({ code: x.code, name: t(x.name, locale), pricing: x.pricing, price: x.price.toFixed(2), maxQty: x.maxQty }));
}

/**
 * "Most booked" models: real confirmed/completed bookings in the last 180 days, top 2 per class,
 * only when a model has at least POPULAR_MIN bookings (no badge on thin data).
 */
export const POPULAR_MIN = 3;
export async function getPopularSlugs(): Promise<Set<string>> {
  await connection();
  const since = new Date(Date.now() - 180 * 86_400_000);
  const rows = await db.booking.groupBy({
    by: ["modelId"],
    where: { status: { in: ["CONFIRMED", "COMPLETED"] }, createdAt: { gte: since } },
    _count: { _all: true },
  });
  if (!rows.length) return new Set();
  const models = await db.vehicleModel.findMany({ where: { id: { in: rows.map((r) => r.modelId) } }, select: { id: true, slug: true, class: true } });
  const byClass = new Map<string, { slug: string; n: number }[]>();
  for (const r of rows) {
    const m = models.find((x) => x.id === r.modelId);
    if (!m || r._count._all < POPULAR_MIN) continue;
    byClass.set(m.class, [...(byClass.get(m.class) ?? []), { slug: m.slug, n: r._count._all }]);
  }
  return new Set([...byClass.values()].flatMap((list) => list.sort((a, b) => b.n - a.n).slice(0, 2).map((x) => x.slug)));
}
