import { db } from "@/lib/db";
import { json, handleError } from "@/server/http";
import { t, type Locale } from "@/server/catalog";

export async function GET(req: Request) {
  try {
    const locale = (new URL(req.url).searchParams.get("locale") ?? "en") as Locale;
    const rows = await db.location.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
    return json({
      data: rows.map((l) => ({
        slug: l.slug, name: t(l.name, locale), address: l.address, isAirport: l.isAirport,
        lat: l.lat?.toString() ?? null, lng: l.lng?.toString() ?? null, phone: l.phone, hours: l.hours,
        pickupFee: l.pickupFee.toFixed(2), returnFee: l.returnFee.toFixed(2),
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}
