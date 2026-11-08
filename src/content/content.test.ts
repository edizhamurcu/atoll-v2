import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PHOTOS, LICENSE_URL, type PhotoKey } from "./photos";
import { photoKeys, posts, readingMinutes, segments, toc, headingId } from "./blog";

const pub = (src: string) => path.join(__dirname, "../../public", src);

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
  it.each(Object.entries(PHOTOS))("%s exists with the declared size and a full credit", (_k, p) => {
    expect(existsSync(pub(p.src))).toBe(true);
    expect(webpSize(pub(p.src))).toEqual({ w: p.w, h: p.h });
    expect(p.alt.length).toBeGreaterThan(15);
    expect(p.author).toBeTruthy();
    expect(LICENSE_URL[p.license]).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(p.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  });
});

describe("blog posts", () => {
  const all = posts();

  it("have unique, URL-safe slugs and are sorted newest first", () => {
    const slugs = all.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    for (let i = 1; i < all.length; i++) expect(all[i - 1].published >= all[i].published).toBe(true);
  });

  it.each(all.map((p) => [p.slug, p] as const))("%s has valid metadata, photos and links", (_s, p) => {
    expect(p.title.length).toBeLessThanOrEqual(90);
    expect(p.description.length).toBeGreaterThan(70);
    expect(p.description.length).toBeLessThanOrEqual(160);
    expect(p.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(p.published))).toBe(false);
    for (const k of photoKeys(p)) expect(PHOTOS[k as PhotoKey], `photo ${k}`).toBeDefined();
    expect(toc(p).length).toBeGreaterThanOrEqual(3);
    expect(readingMinutes(p)).toBeGreaterThanOrEqual(2);
    // Internal links point at localized routes that exist in this app.
    const known = new Set(all.map((q) => `/en/blog/${q.slug}`));
    for (const [, href] of p.body.matchAll(/href="([^"]+)"/g)) {
      expect(href.startsWith("/en/"), href).toBe(true);
      if (href.startsWith("/en/blog/")) expect(known.has(href), href).toBe(true);
    }
    // No stray script/style/iframe in trusted HTML.
    expect(p.body).not.toMatch(/<(script|style|iframe)/i);
  });

  it("splits photos out of the body and gives headings stable ids", () => {
    const p = all.find((q) => q.body.includes("<!--photo:"))!;
    const segs = segments(p);
    expect(segs.some((s) => s.type === "photo")).toBe(true);
    expect(segs.filter((s) => s.type === "html").every((s) => !s.html.includes("<!--photo:"))).toBe(true);
    const ids = toc(p).map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(headingId("1. Traffic drives on the <em>left</em>")).toBe("1-traffic-drives-on-the-left");
  });
});
