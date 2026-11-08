import type { PhotoKey } from "./photos";
import { POSTS_BY_LOCALE } from "./posts";

export type Post = {
  slug: string;
  title: string;
  /** Meta description and card summary, max 160 characters. */
  description: string;
  /** ISO dates (YYYY-MM-DD). */
  published: string;
  updated?: string;
  cover: PhotoKey;
  tags: string[];
  /**
   * Trusted HTML written in this repo. A line `<!--photo:key|caption-->` places a captioned, credited photo.
   * `<h2>` headings become the table of contents.
   */
  body: string;
};

const PHOTO_RE = /<!--photo:([a-z0-9-]+)\|([^>]*?)-->/g;

export const BLOG_LOCALES = Object.keys(POSTS_BY_LOCALE);
const list = (locale: string) => POSTS_BY_LOCALE[locale] ?? POSTS_BY_LOCALE.en;
export const posts = (locale = "en"): Post[] => [...list(locale)].sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug));
export const getPost = (slug: string, locale = "en") => list(locale).find((p) => p.slug === slug) ?? null;
export const postSlugs = () => new Set(POSTS_BY_LOCALE.en.map((p) => p.slug));

export const headingId = (text: string) =>
  text.replace(/<[^>]+>/g, "").toLocaleLowerCase("en").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/&[a-z]+;/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60);

export function plain(html: string) {
  return html.replace(PHOTO_RE, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

const DATE_LOCALE: Record<string, string> = { en: "en-GB", tr: "tr-TR", de: "de-DE", ru: "ru-RU" };
export const fmtDate = (iso: string, locale = "en") =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(DATE_LOCALE[locale] ?? "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const readingMinutes = (p: Post) => Math.max(2, Math.round(plain(p.body).split(" ").length / 220));

/** Table of contents from the post's h2 headings. */
export function toc(p: Post) {
  return [...p.body.matchAll(/<h2>(.*?)<\/h2>/g)].map((m) => ({ id: headingId(m[1]), text: m[1].replace(/<[^>]+>/g, "") }));
}

/** Splits the body into HTML chunks (h2s get ids) and photo blocks. */
export function segments(p: Post): ({ type: "html"; html: string } | { type: "photo"; key: PhotoKey; caption: string })[] {
  const html = p.body.replace(/<h2>(.*?)<\/h2>/g, (_m, t: string) => `<h2 id="${headingId(t)}">${t}</h2>`);
  const out: ReturnType<typeof segments> = [];
  let last = 0;
  for (const m of html.matchAll(PHOTO_RE)) {
    out.push({ type: "html", html: html.slice(last, m.index) });
    out.push({ type: "photo", key: m[1] as PhotoKey, caption: m[2].trim() });
    last = m.index + m[0].length;
  }
  out.push({ type: "html", html: html.slice(last) });
  return out.filter((s) => s.type === "photo" || s.html.trim());
}

/** Photo keys referenced anywhere in a post (cover + inline). */
export const photoKeys = (p: Post) => [p.cover, ...[...p.body.matchAll(PHOTO_RE)].map((m) => m[1])];

export const related = (p: Post, locale = "en", n = 3) => {
  const score = (q: Post) => q.tags.filter((t) => p.tags.includes(t)).length;
  return posts(locale).filter((q) => q.slug !== p.slug).sort((a, b) => score(b) - score(a)).slice(0, n);
};
