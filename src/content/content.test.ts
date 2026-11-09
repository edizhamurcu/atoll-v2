import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PHOTOS, LICENSE_URL, type PhotoKey } from "./photos";
import { BLOG_LOCALES, photoKeys, posts, readingMinutes, segments, toc, headingId } from "./blog";
import { GUIDES } from "./guide";
import { pageTranslation, translatedSlugs } from "./page-i18n";
import { localizedRentalInfo } from "./rental-info";

const LOCALES = ["en", "tr", "de", "ru"] as const;
const pub = (src: string) => path.join(__dirname, "../../public", src);
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

/** Width/height straight from the WebP header (VP8X / VP8 / VP8L). */
function webpSize(file: string) {
  const b = readFileSync(file);
  expect(b.toString("ascii", 0, 4)).toBe("RIFF");
  expect(b.toString("ascii", 8, 12)).toBe("WEBP");
  const kind = b.toString("ascii", 12, 16);
  if (kind === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (kind === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  const bits = b.readUInt32LE(21);
  return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
}

describe("photos", () => {
  it.each(Object.entries(PHOTOS))("%s exists with the declared size, a full credit and alt text in every language", (_k, p) => {
    expect(existsSync(pub(p.src))).toBe(true);
    expect(webpSize(pub(p.src))).toEqual({ w: p.w, h: p.h });
    for (const l of LOCALES) expect(p.alt[l].length, l).toBeGreaterThan(10);
    expect(p.author).toBeTruthy();
    expect(LICENSE_URL[p.license]).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(p.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  });
});

describe("blog posts", () => {
  const en = posts("en");

  it("exist in every language with the same slugs, covers and tags", () => {
    expect([...BLOG_LOCALES].sort()).toEqual([...LOCALES].sort());
    for (const l of LOCALES) {
      const list = posts(l);
      expect(list.map((p) => p.slug).sort(), l).toEqual(en.map((p) => p.slug).sort());
      for (const p of list) {
        const src = en.find((q) => q.slug === p.slug)!;
        expect([p.cover, p.published, p.tags.join()], `${l}/${p.slug}`).toEqual([src.cover, src.published, src.tags.join()]);
      }
    }
  });

  it("have unique, URL-safe slugs and are sorted newest first", () => {
    const slugs = en.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    for (let i = 1; i < en.length; i++) expect(en[i - 1].published >= en[i].published).toBe(true);
  });

  const cases = LOCALES.flatMap((l) => posts(l).map((p) => [`${l}/${p.slug}`, l, p] as const));
  it.each(cases)("%s has valid metadata, photos and localized links", (_id, l, p) => {
    const src = en.find((q) => q.slug === p.slug)!;
    expect(p.title.length).toBeLessThanOrEqual(100);
    expect(p.description.length).toBeGreaterThan(70);
    expect(p.description.length).toBeLessThanOrEqual(170);
    for (const k of photoKeys(p)) expect(PHOTOS[k as PhotoKey], `photo ${k}`).toBeDefined();
    expect(photoKeys(p)).toEqual(photoKeys(src));
    expect(toc(p).length).toBe(toc(src).length);
    expect(count(p.body, /<li>/g)).toBe(count(src.body, /<li>/g));
    expect(readingMinutes(p)).toBeGreaterThanOrEqual(2);
    const known = new Set(en.map((q) => `/${l}/blog/${q.slug}`));
    const hrefs = [...p.body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBe(count(src.body, /href="/g));
    for (const href of hrefs) {
      expect(href.startsWith(`/${l}/`), href).toBe(true);
      if (href.includes("/blog/")) expect(known.has(href), href).toBe(true);
    }
    expect(p.body).not.toMatch(/<(script|style|iframe)/i);
    if (l !== "en") expect(p.title).not.toBe(src.title);
  });

  it("splits photos out of the body and gives headings stable ids", () => {
    const p = en.find((q) => q.body.includes("<!--photo:"))!;
    const segs = segments(p);
    expect(segs.some((s) => s.type === "photo")).toBe(true);
    expect(segs.filter((s) => s.type === "html").every((s) => !s.html.includes("<!--photo:"))).toBe(true);
    for (const l of LOCALES) for (const q of posts(l)) {
      const ids = toc(q).map((t) => t.id);
      expect(new Set(ids).size, `${l}/${q.slug}`).toBe(ids.length);
      expect(ids.every(Boolean)).toBe(true);
    }
    expect(headingId("1. Traffic drives on the <em>left</em>")).toBe("1-traffic-drives-on-the-left");
    expect(headingId("Kış (Aralık–Şubat)")).toBe("kis-aralik-subat");
  });
});

describe("guide content", () => {
  const en = GUIDES.en;
  it.each(LOCALES.filter((l) => l !== "en"))("%s has the same structure as English and is translated", (l) => {
    const g = GUIDES[l];
    expect(g.facts.items.length).toBe(en.facts.items.length);
    expect(g.regions.items.length).toBe(en.regions.items.length);
    g.regions.items.forEach((r, i) => {
      expect(r.see.length).toBe(en.regions.items[i].see.length);
      expect(!!r.cta).toBe(!!en.regions.items[i].cta);
    });
    expect(g.sights.items.length).toBe(en.sights.items.length);
    expect(g.when.seasons.length).toBe(en.when.seasons.length);
    expect(g.when.festivals.length).toBe(en.when.festivals.length);
    expect(g.around.items.map((i) => !!i.link)).toEqual(en.around.items.map((i) => !!i.link));
    expect(g.faq.items.length).toBe(en.faq.items.length);
    expect(g.cta.text).toContain("{price}");
    expect(g.meta.title).not.toBe(en.meta.title);
    expect(g.meta.description.length).toBeLessThanOrEqual(175);
    expect(JSON.stringify(g)).not.toContain(en.hero.lead);
  });
});

describe("content page translations", () => {
  it("cover the same pages in every language", () => {
    const tr = translatedSlugs("tr").sort();
    expect(tr.length).toBe(11);
    expect(translatedSlugs("de").sort()).toEqual(tr);
    expect(translatedSlugs("ru").sort()).toEqual(tr);
  });
  it.each(translatedSlugs("tr"))("%s keeps images, tables and headings, with links in its own language", (slug) => {
    const base = pageTranslation(slug, "tr")!;
    for (const l of ["tr", "de", "ru"]) {
      const p = pageTranslation(slug, l)!;
      expect(p.title.length).toBeGreaterThan(2);
      expect(count(p.html, /<img /g), l).toBe(count(base.html, /<img /g));
      expect(count(p.html, /<h[2-4]>/g), l).toBe(count(base.html, /<h[2-4]>/g));
      expect(count(p.html, /<tr>/g), l).toBe(count(base.html, /<tr>/g));
      for (const [, href] of p.html.matchAll(/href="([^"]+)"/g)) expect(href.startsWith(`/${l}`), `${l} ${href}`).toBe(true);
      expect(p.html.split("<!--excess-->").join("")).not.toMatch(/pacific-rentals|<!--/); // the excess marker is rendered from damage-excess.ts
    }
  });
});

describe("rental information", () => {
  const html = `<h3>Driver &amp; licence requirements</h3><p>Damage Excess - £450.00</p><p>the most you’ll pay towards repairs covered by the Collision Damage Waiver is the damage excess (£450.00).</p><p>the hire car will be delivered with £20.00 worth of fuel inside.</p><p>Your rental includes unlimited free kilometres.</p>`;
  it("is translated when it is the standard WordPress text, with the same amounts", () => {
    for (const l of ["tr", "de", "ru"]) {
      const r = localizedRentalInfo(html, l);
      expect(r.lang).toBe(l);
      expect(r.html).toContain("£450.00");
      expect(r.html).toContain("£20.00");
      expect(r.html).not.toContain("Collision Damage Waiver");
    }
    expect(localizedRentalInfo(html, "en")).toEqual({ html, lang: "en" });
    expect(localizedRentalInfo("<p>Something else</p>", "tr")).toEqual({ html: "<p>Something else</p>", lang: "en" });
  });
});

describe("prices are GBP only", () => {
  it("no euro/dollar amounts in UI messages, translated pages or site config", async () => {
    const fs = await import("node:fs");
    const files = ["messages/en.json", "messages/tr.json", "messages/de.json", "messages/ru.json", "src/content/page-i18n/tr.ts", "src/content/page-i18n/de.ts", "src/content/page-i18n/ru.ts", "src/content/rental-info.ts", "src/lib/site.ts"];
    const money = /(€|\bEUR\b|\d\s*euros?\b|\beuros?\s*\d|\d\s*евро|US?\$\s*\d)/i;
    for (const f of files) expect(fs.readFileSync(f, "utf8"), f).not.toMatch(money);
  });
});

describe("contact form topics", () => {
  it("every topic has a label and a hint in every language, plus an English staff label", async () => {
    const { CONTACT_TOPICS, CONTACT_TOPIC_LABELS } = await import("./contact-topics");
    for (const l of ["en", "tr", "de", "ru"]) {
      const c = JSON.parse(readFileSync(`messages/${l}.json`, "utf8")).contact;
      for (const k of CONTACT_TOPICS) {
        expect(c.topics[k], `${l}.${k}`).toBeTruthy();
        expect(c.topicHints[k], `${l}.${k} hint`).toBeTruthy();
      }
      expect(c.topicHints.none && c.subjectNone && c.subjectRequired && c.namePh && c.emailPh).toBeTruthy();
      if (l !== "en") expect(c.topics.booking_enquiry).not.toBe("Booking enquiry / availability");
    }
    for (const k of CONTACT_TOPICS) expect(CONTACT_TOPIC_LABELS[k]).toBeTruthy();
  });
});
