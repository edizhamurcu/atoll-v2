import { db } from "@/lib/db";
import { json, handleError } from "@/server/http";
import { t, type Locale } from "@/server/catalog";

export async function GET(req: Request) {
  try {
    const locale = (new URL(req.url).searchParams.get("locale") ?? "en") as Locale;
    const rows = await db.extra.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
    return json({ data: rows.map((x) => ({ code: x.code, name: t(x.name, locale), info: t(x.info, locale), pricing: x.pricing, price: x.price.toFixed(2), maxQty: x.maxQty })) });
  } catch (e) {
    return handleError(e);
  }
}
