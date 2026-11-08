import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { posts } from "@/content/blog";
import { translatedLocales } from "@/content/page-i18n";

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
    ...localized("/north-cyprus-guide", new Date("2026-11-08"), 0.8, "monthly"),
    ...localized("/blog", new Date(posts()[0]?.published ?? "2026-11-08"), 0.7, "weekly"),
    ...posts().flatMap((p) => localized(`/blog/${p.slug}`, new Date(p.updated ?? p.published), 0.7, "monthly")),
    ...pages.filter((p) => !CODE_ROUTES.has(p.slug)).flatMap((p) => {
      const langs = ["en", ...translatedLocales(p.slug)];
      const languages = { ...Object.fromEntries(langs.map((l) => [l, `${SITE.url}/${l}/${p.slug}`])), "x-default": `${SITE.url}/en/${p.slug}` };
      return langs.map((l) => ({ url: `${SITE.url}/${l}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6, alternates: { languages } }));
    }),
  ];
}
