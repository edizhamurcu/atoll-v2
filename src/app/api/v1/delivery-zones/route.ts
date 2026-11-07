import { db } from "@/lib/db";
import { json, handleError } from "@/server/http";

export async function GET() {
  try {
    const rows = await db.deliveryZone.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
    return json({ data: rows.map((z) => ({ slug: z.slug, name: z.name, areas: z.areas, tiers: z.tiers })) });
  } catch (e) {
    return handleError(e);
  }
}
