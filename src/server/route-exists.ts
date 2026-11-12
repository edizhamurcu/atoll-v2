import { db } from "@/lib/db";
import { postSlugs } from "@/content/blog";

/** Slugs of DB-backed routes, cached briefly so the proxy can answer 404 before streaming starts. */
let cache: { at: number; pages: Set<string>; models: Set<string> } | null = null;
const TTL = 60_000;

async function load() {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const [pages, models] = await Promise.all([
    db.page.findMany({ select: { slug: true } }),
    db.vehicleModel.findMany({ where: { active: true }, select: { slug: true } }),
  ]);
  cache = { at: Date.now(), pages: new Set(pages.map((p) => p.slug)), models: new Set(models.map((m) => m.slug)) };
  return cache;
}

export const STATIC_ROUTES = new Set(["cars", "car-prices", "car-sales", "contact", "booking", "blog", "north-cyprus-guide", "south-cyprus-guide", "driving-in-south-cyprus", "review"]);

/** true = known route, false = definitely missing, null = not a DB-backed path (let Next decide). */
export async function dbRouteExists(segments: string[]): Promise<boolean | null> {
  try {
    if (segments.length === 1) {
      if (STATIC_ROUTES.has(segments[0])) return null;
      return (await load()).pages.has(segments[0]);
    }
    if (segments.length === 2 && segments[0] === "blog") return postSlugs().has(segments[1]);
    if (segments.length === 2 && segments[0] === "cars") return (await load()).models.has(segments[1]);
    return null;
  } catch {
    return null; // DB down: never turn that into a 404
  }
}
