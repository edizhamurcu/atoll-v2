import type { PhotoKey } from "../photos";

/** A link inside a travel page; `href` is a locale-less site path such as "/driving-in-south-cyprus". */
export type TravelLink = { label: string; href: string };

/**
 * Sections of a travel page, rendered in order by <TravelGuideView>. Photo keys are part of the content so the
 * same layout serves several pages; every language of one page must use the same keys (checked in tests).
 */
export type TravelSection =
  | { kind: "regions"; id: string; title: string; lead?: string; items: { name: string; local?: string; tag: string; text: string; see: string[]; photo: PhotoKey }[] }
  | { kind: "cards"; id: string; title: string; lead?: string; items: { name: string; where: string; text: string; photo: PhotoKey }[] }
  | { kind: "split"; id: string; title: string; paragraphs: string[]; photo: PhotoKey; caption?: string; reverse?: boolean; link?: TravelLink }
  | { kind: "seasons"; id: string; title: string; items: { name: string; months: string; text: string }[]; note?: string }
  /** A real sequence (numbered on the page). */
  | { kind: "steps"; id: string; title: string; lead?: string; items: { title: string; text: string }[] }
  | { kind: "rules"; id: string; title: string; lead?: string; items: { strong: string; text: string }[]; photo?: PhotoKey; link?: TravelLink }
  | { kind: "callout"; id: string; tone: "warn" | "info"; title: string; text: string; link?: TravelLink };

export type TravelPage = {
  meta: { title: string; description: string };
  breadcrumb: string;
  /** Schema.org TouristDestination name; omit for pages that are not about a destination. */
  destination?: string;
  heroPhoto: PhotoKey;
  hero: { title: string; lead: string; primary: TravelLink; secondary: TravelLink; updated: string; updatedDate: string };
  facts: { title: string; items: [string, string][] };
  sections: TravelSection[];
  faq: { title: string; items: { q: string; a: string }[] };
  blog: { title: string; all: string };
  cta: { title: string; text: string; button: string };
  credits: { title: string };
  touristTypes?: string[];
};

/** Photo keys used by a page, in order of appearance (for credits and the per-language consistency test). */
export function pagePhotos(p: TravelPage): PhotoKey[] {
  const keys: PhotoKey[] = [p.heroPhoto];
  for (const s of p.sections) {
    if (s.kind === "regions" || s.kind === "cards") keys.push(...s.items.map((i) => i.photo));
    else if ((s.kind === "split" || s.kind === "rules") && s.photo) keys.push(s.photo);
  }
  return [...new Set(keys)];
}
