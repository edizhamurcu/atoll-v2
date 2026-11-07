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
