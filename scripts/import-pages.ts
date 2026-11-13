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
  // Leftovers from the template site the WordPress pages were copied from.
  [/href="https:\/\/www\.pacific-rentals\.com\/contact\.asp"/g, 'href="/en/contact"'],
  [/href="https:\/\/www\.pacific-rentals\.com\/fuel-options\.asp"/g, 'href="/en/fuel-options"'],
  // "rental agreement" link pointed back at the rental terms page.
  [/<a href="\/en\/rental-terms">rental agreement<\/a>/g, '<a href="/en/rental-terms#agreement">rental agreement</a>'],
  // Damage excess depends on the car class (owner decision 2026-11-09): rendered from src/content/damage-excess.ts.
  [/<p>Damaged Excess is fixed at 500 Euros<\/p>/g, "<p>Damage excess depends on the car class:</p>\n<!--excess-->"],
  [/this will cost 25 Euros \(subject to change\)/g, "this will cost about £21 (paid at the border, subject to change)"],
  // Owner, 2026-11-11: company name on the transfer page; the agreement must allow driving into South Cyprus (as the rental terms say)
  [/Exclusive Offer to Pacific Rent-A-Car Clients/g, "Exclusive Offer to Atoll Rent A Car Clients"],
  [/<li>Vehicle not to be taken out of the TRNC<\/li>/g, "<li>The vehicle may not be taken out of the TRNC, except into South Cyprus</li>"],
  [/\(g\) The renter shall not take the vehicle outside the Turkish Republic of Northern Cyprus,/g, "(g) The renter shall not take the vehicle outside the Turkish Republic of Northern Cyprus, except into South Cyprus,"],
  // Owner, 2026-11-12: wording of "1. Parties" in the rental agreement
  [/Atoll Rent A Car Ltd\. is hereinafter called the Owner\. The real or incorporated person whose names, address, and signatures appear on the first page of this contract are hereinafter called the Renter\./g,
    "Atoll Rent A Car Ltd. is the owner of the vehicles. The real or incorporated person whose name, address and signature appear on the first page of this contract is hereinafter the Renter."],
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
