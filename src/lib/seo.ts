import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export const BRAND = "Atoll Rent A Car";
const SUFFIX = ` | ${BRAND}`;
export const TITLE_MAX = 65;
export const DESC_MAX = 160;
export const DEFAULT_OG = { url: "/brand/og.png", width: 1200, height: 630, alt: "Atoll Rent A Car — car rental in North Cyprus" };

/** Keeps the brand suffix only when the whole title still fits in a search result (~65 chars). */
export function seoTitle(t: string): Metadata["title"] {
  return t.length + SUFFIX.length <= TITLE_MAX || t.includes(BRAND) ? t : { absolute: t };
}

/** Meta description of at most DESC_MAX characters, cut at a word boundary. */
export function seoDescription(d: string | null | undefined): string | undefined {
  if (!d) return undefined;
  const s = d.replace(/\s+/g, " ").trim();
  if (s.length <= DESC_MAX) return s;
  const cut = s.slice(0, DESC_MAX - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** canonical + every language + x-default (English) for a locale-prefixed path such as "/cars". */
export function seoAlternates(locale: string, path: string, langs: readonly string[] = routing.locales): Metadata["alternates"] {
  const p = path === "/" ? "" : path;
  return { canonical: `/${locale}${p}`, languages: { ...Object.fromEntries(langs.map((l) => [l, `/${l}${p}`])), "x-default": `/en${p}` } };
}

/**
 * Final pass for every page's metadata: short title, clamped description, and an Open Graph block that always has
 * an image (a page-level openGraph replaces the layout's, so without this shared links lose their picture).
 */
export function seo(m: Metadata, locale: string): Metadata {
  const title = typeof m.title === "string" ? m.title : undefined;
  const description = seoDescription(typeof m.description === "string" ? m.description : undefined);
  const og = (m.openGraph ?? {}) as NonNullable<Metadata["openGraph"]>;
  const ogImages = og.images && (!Array.isArray(og.images) || og.images.length) ? og.images : [DEFAULT_OG];
  return {
    ...m,
    title: title ? seoTitle(title) : m.title,
    description,
    openGraph: { siteName: BRAND, locale, type: "website", ...og, title: (og.title as string | undefined) ?? title, description: seoDescription((og.description as string | undefined) ?? description), images: ogImages },
    twitter: { card: "summary_large_image", title: title, description, images: (Array.isArray(ogImages) ? ogImages : [ogImages]).map((i) => (typeof i === "string" ? i : "url" in i ? String(i.url) : String(i))) },
  };
}
