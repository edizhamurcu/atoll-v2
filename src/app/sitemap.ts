import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { posts } from "@/content/blog";

const CODE_ROUTES = new Set(["north-cyprus-guide", "blog"]);

/** All public URLs in 4 languages with hreflang alternates; migrated content pages are English (canonical /en). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [models, pages] = await Promise.all([
    db.vehicleModel.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    db.page.findMany({ where: { showInSitemap: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const localized = (path: string, lastModified: Date, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) =>
    routing.locales.map((l) => ({
      url: `${SITE.url}/${l}${path}`,
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages: { ...Object.fromEntries(routing.locales.map((x) => [x, `${SITE.url}/${x}${path}`])), "x-default": `${SITE.url}/en${path}` } },
    }));
  const now = new Date();
  return [
    ...localized("", now, 1, "daily"),
    ...localized("/cars", now, 0.9, "daily"),
    ...localized("/car-prices", now, 0.8, "weekly"),
    ...localized("/contact", now, 0.6, "monthly"),
    ...models.flatMap((m) => localized(`/cars/${m.slug}`, m.updatedAt, 0.8, "weekly")),
    { url: `${SITE.url}/en/north-cyprus-guide`, lastModified: new Date("2026-11-08"), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE.url}/en/blog`, lastModified: new Date(posts()[0]?.published ?? "2026-11-08"), changeFrequency: "weekly" as const, priority: 0.7 },
    ...posts().map((p) => ({ url: `${SITE.url}/en/blog/${p.slug}`, lastModified: new Date(p.updated ?? p.published), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...pages.filter((p) => !CODE_ROUTES.has(p.slug)).map((p) => ({ url: `${SITE.url}/en/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
