/**
 * Import WordPress content pages (exported to clean HTML) 1:1.
 * Usage: tsx scripts/import-pages.ts <pages.json>
 * Old slugs keep working: /<old-slug> redirects to /en/<new-slug> (see next.config redirects + legacySlug).
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

type WpPage = { slug: string; title: string; html: string; yoast_title?: string; yoast_desc?: string };
// Old WP slug -> new slug. Pages rebuilt as app routes are skipped (home, contact form, car lists).
const SLUG: Record<string, string | null> = {
  "home-page": null, contact: null, "our-cars": null, "explore-vehicles-2": null, "north-cyprus-guide": null,
  "about-us-2": "about-us", "privacy-policy-2": "privacy-policy",
};
// Internal links in the old content -> new routes.
const LINKS: [RegExp, string][] = [
  [/href="\/explore-vehicles(-2)?\/?"/g, 'href="/en/cars"'],
  [/href="\/our-cars\/?"/g, 'href="/en/cars"'],
  [/href="\/contact\/?"/g, 'href="/en/contact"'],
  [/href="\/about-us-2\/?"/g, 'href="/en/about-us"'],
  [/href="\/privacy-policy-2\/?"/g, 'href="/en/privacy-policy"'],
  [/href="\/([a-z0-9-]+)\/?"/g, 'href="/en/$1"'],
];

export function cleanHtml(html: string) {
  let h = html
    .replace(/<p>\s*(<h[1-6][^>]*>)/g, "$1")
    .replace(/(<\/h[1-6]>)\s*<\/p>/g, "$1")
    .replace(/<p>(\s|&nbsp;| )*<\/p>/g, "")
    .replace(/ /g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "’")
    .replace(/&#039;/g, "'")
    .replace(/<img([^>]*?)src="\/media\//g, '<img loading="lazy"$1src="/media/pages/');
  for (const [re, to] of LINKS) h = h.replace(re, to);
  return h.trim();
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: import-pages.ts <pages.json>");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, options: "-c timezone=UTC" }) });
  const pages = JSON.parse(readFileSync(file, "utf8")) as WpPage[];
  for (const p of pages) {
    const slug = p.slug in SLUG ? SLUG[p.slug] : p.slug;
    if (!slug) continue;
    const data = { title: p.title.trim(), html: cleanHtml(p.html), metaTitle: p.yoast_title || null, metaDescription: p.yoast_desc || null, legacySlug: p.slug };
    await db.page.upsert({ where: { slug }, create: { slug, ...data }, update: data });
    console.log(`page /en/${slug.padEnd(58)} ${data.html.length} chars`);
  }
  await db.$disconnect();
}

if (process.argv[1]?.endsWith("import-pages.ts")) main().catch((e) => { console.error(e); process.exit(1); });
