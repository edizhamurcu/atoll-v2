import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { posts } from "@/content/blog";
import { translatedLocales } from "@/content/page-i18n";

/** Last edit of code-defined page content (home, contact). Bump when those texts change. */
const SITE_CONTENT_UPDATED = new Date("2026-11-12T00:00:00Z");
const CODE_ROUTES = new Set(["north-cyprus-guide", "south-cyprus-guide", "driving-in-south-cyprus", "blog"]);

/** All public URLs in 4 languages with hreflang alternates; migrated content pages are English (canonical /en). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [models, pages, lastSale] = await Promise.all([
    db.vehicleModel.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    db.page.findMany({ where: { showInSitemap: true }, select: { slug: true, updatedAt: true } }),
    db.saleCar.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
  ]);
  const localized = (path: string, lastModified: Date, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) =>
    routing.locales.map((l) => ({
      url: `${SITE.url}/${l}${path}`,
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages: { ...Object.fromEntries(routing.locales.map((x) => [x, `${SITE.url}/${x}${path}`])), "x-default": `${SITE.url}/en${path}` } },
    }));
  // Real change dates only (a lastmod that is always "now" is ignored by search engines).
  const latest = (...ds: (Date | undefined | null)[]) => new Date(Math.max(SITE_CONTENT_UPDATED.getTime(), ...ds.filter(Boolean).map((d) => d!.getTime())));
  const fleetUpdated = latest(...models.map((m) => m.updatedAt));
  const blogUpdated = latest(...posts().map((p) => new Date(p.updated ?? p.published)));
  return [
    ...localized("", latest(fleetUpdated, blogUpdated), 1, "daily"),
    ...localized("/cars", fleetUpdated, 0.9, "daily"),
    ...localized("/car-prices", fleetUpdated, 0.8, "weekly"),
    ...localized("/car-sales", latest(lastSale?.updatedAt), 0.7, "weekly"),
    ...localized("/contact", SITE_CONTENT_UPDATED, 0.6, "monthly"),
    ...models.flatMap((m) => localized(`/cars/${m.slug}`, m.updatedAt, 0.8, "weekly")),
    ...localized("/north-cyprus-guide", new Date("2026-11-08"), 0.8, "monthly"),
    ...localized("/south-cyprus-guide", new Date("2026-11-12"), 0.8, "monthly"),
    ...localized("/driving-in-south-cyprus", new Date("2026-11-12"), 0.7, "monthly"),
    ...localized("/blog", blogUpdated, 0.7, "weekly"),
    ...posts().flatMap((p) => localized(`/blog/${p.slug}`, new Date(p.updated ?? p.published), 0.7, "monthly")),
    ...pages.filter((p) => !CODE_ROUTES.has(p.slug)).flatMap((p) => {
      const langs = ["en", ...translatedLocales(p.slug)];
      const languages = { ...Object.fromEntries(langs.map((l) => [l, `${SITE.url}/${l}/${p.slug}`])), "x-default": `${SITE.url}/en/${p.slug}` };
      return langs.map((l) => ({ url: `${SITE.url}/${l}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6, alternates: { languages } }));
    }),
  ];
}
