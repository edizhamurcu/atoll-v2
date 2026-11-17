import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PHOTOS, LICENSE_URL, type PhotoKey } from "./photos";
import { BLOG_LOCALES, photoKeys, posts, readingMinutes, segments, toc, headingId } from "./blog";
import { GUIDES } from "./guide";
import { pageTranslation, translatedSlugs } from "./page-i18n";
import { ABOUT } from "./page-i18n/about";
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
      for (const [, href] of p.html.matchAll(/href="([^"]+)"/g)) expect(href.startsWith(`/${l}`) || /^(tel|mailto):/.test(href), `${l} ${href}`).toBe(true);
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

describe("contact details (owner corrections 2026-11-09)", () => {
  it("office address is 157 Karaoğlanoğlu Caddesi in config and every language", async () => {
    const { SITE } = await import("@/lib/site");
    expect(SITE.address.street).toBe("157 Karaoğlanoğlu Caddesi");
    for (const l of ["en", "tr", "de", "ru"]) expect(JSON.parse(readFileSync(`messages/${l}.json`, "utf8")).footer.address).toMatch(/^157 Karaoğlanoğlu/);
  });
  it("language lines sit under the contact details: RU/TR 0539 102 57 57, EN 0539 103 61 61 (owner, 2026-11-17)", async () => {
    const { LANGUAGE_LINES } = await import("@/lib/site");
    expect(LANGUAGE_LINES.map((l) => l.phone)).toEqual(["+90 539 102 57 57", "+90 539 103 61 61"]);
    expect(readFileSync("src/components/site-footer.tsx", "utf8")).toContain("<LanguageLines");
    expect(readFileSync("src/app/[locale]/contact/page.tsx", "utf8")).toContain("<LanguageLines");
  });
  it("+90 539 103 61 66 is the primary number for calls and WhatsApp; the second number follows", async () => {
    const { SITE, PHONES, waLink } = await import("@/lib/site");
    expect(SITE.phone).toBe("+90 539 103 61 66");
    expect(SITE.whatsapp).toBe(SITE.phone);
    expect(PHONES).toEqual(["+90 539 103 61 66", "+90 533 823 65 55"]);
    expect(waLink()).toBe("https://wa.me/905391036166");
    expect(readFileSync("src/components/site-footer.tsx", "utf8")).toContain("PHONES.map");
  });
});

describe("home page and car sales copy (2026-11-10)", () => {
  it("real estate block is gone and OSK/sales copy exists in every language", () => {
    const en = JSON.parse(readFileSync("messages/en.json", "utf8"));
    for (const l of ["en", "tr", "de", "ru"]) {
      const m = JSON.parse(readFileSync(`messages/${l}.json`, "utf8"));
      expect(m.home.estate, l).toBeUndefined();
      for (const k of ["oskTitle", "oskLead", "oskCta", "oskSales", "oskWorkshop", "oskBody", "oskWash"]) expect(m.home[k], `${l}.${k}`).toBeTruthy();
      expect(Object.keys(m.sales).sort(), l).toEqual(Object.keys(en.sales).sort());
      expect(Object.keys(m.sales.imgAlt).sort(), l).toEqual(Object.keys(en.sales.imgAlt).sort());
      expect(m.hero.lead, l).not.toMatch(/100/);
      expect(m.home.fact2, l).toMatch(/Metehan|Метехан/);
    }
  });

  it("about us no longer mentions real estate in any language", () => {
    for (const [l, page] of Object.entries(ABOUT)) {
      expect(`${page.title} ${page.metaDescription} ${page.html}`, l).not.toMatch(/real estate|emlak|Immobilien|недвижим|ofis yatırım|invest/i);
    }
  });
});

describe("footer mirrors the header (2026-11-10)", () => {
  it("has separate rental and sales groups and only real social links", async () => {
    const src = readFileSync("src/components/site-footer.tsx", "utf8");
    for (const href of ["/rental-terms", "/car-prices", "/car-sales#stock", "/about-us", "/privacy-policy"]) expect(src).toContain(`"${href}"`);
    const { SOCIAL } = await import("@/lib/site");
    expect(SOCIAL.map((s) => s.key)).toEqual(expect.arrayContaining(["instagram", "facebook"]));
    for (const s of SOCIAL) expect(s.url).toMatch(/^https:\/\/www\.(instagram|facebook|youtube)\.com\//);
    for (const l of ["en", "tr", "de", "ru"]) {
      const f = JSON.parse(readFileSync(`messages/${l}.json`, "utf8")).footer;
      expect(f.follow, l).toBeTruthy();
      expect(f.company, l).toBeTruthy();
    }
  });
});


describe("streamed Suspense content always reveals (2026-11-10)", () => {
  it("layout ships the $RV flush fallback for frame-starved browsers", () => {
    const src = readFileSync("src/app/[locale]/layout.tsx", "utf8");
    expect(src).toContain("STREAM_REVEAL_FALLBACK");
    expect(src).toMatch(/window\.\$RB/);
  });
});

describe("contact map (2026-11-10)", () => {
  it("Google Maps embed points at the plus code 86W3+W43 and the office coordinates match it", async () => {
    const { mapEmbedUrl, mapDirectionsUrl, SITE } = await import("@/lib/site");
    expect(decodeURIComponent(mapEmbedUrl("tr"))).toContain("Atoll Rent A Car, 86W3+W43, Alsancak");
    expect(mapEmbedUrl("tr")).toMatch(/^https:\/\/www\.google\.com\/maps\?q=.*&output=embed$/);
    expect(mapDirectionsUrl).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
    expect(SITE.address.lat).toBeCloseTo(35.3473, 3);
    expect(SITE.address.lng).toBeCloseTo(33.2028, 3);
  });
});


describe("weekly offer: one car per class (owner, 2026-11-11)", () => {
  it("exactly one car from each class gets rent 7 / pay 6; others get nothing", async () => {
    const { CAMPAIGNS, campaignsFor, campaignFor } = await import("./campaigns");
    expect(CAMPAIGNS).toHaveLength(1);
    expect(CAMPAIGNS[0]).toMatchObject({ code: "week_1_day_free", minDays: 7, freeDays: 1 });
    for (const slug of ["nissan-note", "nissan-juke", "suzuki-vitara", "toyota-sienta-1-5", "mercedes-c200", "hyundai-ix35", "ford-focus"]) expect(campaignFor(slug, new Date("2026-11-18T08:00:00Z"))).not.toBeNull();
    for (const slug of ["bmw-520d", "hyundai-i30", "toyota-vitz", "mazda-carol"]) expect(campaignsFor(slug, new Date("2026-11-18T08:00:00Z"))).toEqual([]);
  });
  it("all campaigns end after rentals starting on 31 March 2027 (Cyprus time); normal prices afterwards (owner, 2026-11-16)", async () => {
    const { campaignsFor, campaignFor, activeCampaigns } = await import("./campaigns");
    expect(campaignsFor("ford-focus", new Date("2027-03-31T20:00:00Z"))).toHaveLength(1); // 23:00 in Cyprus (EEST)
    expect(campaignsFor("ford-focus", new Date("2027-03-31T21:00:00Z"))).toEqual([]); // 1 April 00:00 in Cyprus
    expect(campaignFor("hyundai-ix35", new Date("2027-04-02T08:00:00Z"))).toBeNull();
    expect(activeCampaigns(new Date("2027-06-01T08:00:00Z"))).toEqual([]);
  });
  it("results show the normal daily rate (not the discounted average) and no stock counter", () => {
    const results = readFileSync("src/components/results.tsx", "utf8");
    expect(results).toContain("r.quote.normalDaily ?? r.quote.averageDaily");
    expect(results).not.toContain('t("available"');
  });
  it("campaign copy exists in every language with the same keys", () => {
    const en = JSON.parse(readFileSync("messages/en.json", "utf8")).campaign;
    for (const l of ["tr", "de", "ru"]) expect(Object.keys(JSON.parse(readFileSync(`messages/${l}.json`, "utf8")).campaign).sort(), l).toEqual(Object.keys(en).sort());
  });
});

describe("content fixes (owner, 2026-11-11)", () => {
  it("no other company name on the transfer page, and the agreement allows only South Cyprus", async () => {
    const { pageTranslation } = await import("./page-i18n");
    const south: Record<string, RegExp> = { tr: /Güney Kıbrıs'a geçiş/, de: /Südzypern/, ru: /Южный Кипр/ };
    for (const l of ["tr", "de", "ru"] as const) {
      const transfer = pageTranslation("larnaca-airport-transfer-to-girne-kyrenia-north-cyprus", l)!;
      expect(transfer.html, l).not.toMatch(/Pacific/i);
      expect(transfer.html, l).toContain("Atoll Rent A Car");
      const agreement = pageTranslation("rental-agreement", l)!.html;
      expect(agreement.match(new RegExp(south[l].source, "g"))?.length ?? 0, l).toBeGreaterThanOrEqual(2);
    }
    const imp = readFileSync("scripts/import-pages.ts", "utf8");
    expect(imp).toContain("Exclusive Offer to Atoll Rent A Car Clients");
    expect(imp).toContain("except into South Cyprus");
  });
});

describe("rental agreement, 1. Parties (owner, 2026-11-12)", () => {
  it("uses the owner's wording in Turkish and the matching translations", async () => {
    const { pageTranslation } = await import("./page-i18n");
    expect(pageTranslation("rental-agreement", "tr")!.html).toContain("<p>Atoll Rent A Car Ltd. araçların sahibidir. Bu sözleşmenin ilk sayfasında adı, adresi ve imzası bulunan gerçek veya tüzel kişi bundan böyle Kiralayan kişidir.</p>");
    expect(pageTranslation("rental-agreement", "de")!.html).toContain("ist Eigentümerin der Fahrzeuge");
    expect(pageTranslation("rental-agreement", "ru")!.html).toContain("является владельцем автомобилей");
    expect(readFileSync("scripts/import-pages.ts", "utf8")).toContain("Atoll Rent A Car Ltd. is the owner of the vehicles.");
  });
});

describe("fleet cards (2026-11-12)", () => {
  it("fleetCards copy exists in every language with the same keys", () => {
    const en = JSON.parse(readFileSync("messages/en.json", "utf8")).fleetCards;
    for (const l of ["tr", "de", "ru"]) expect(Object.keys(JSON.parse(readFileSync(`messages/${l}.json`, "utf8")).fleetCards).sort(), l).toEqual(Object.keys(en).sort());
  });
  it("popular badge needs real bookings (min 3 in 180 days) and campaign cars sort first", () => {
    const q = readFileSync("src/server/queries.ts", "utf8");
    expect(q).toMatch(/POPULAR_MIN = 3/);
    expect(q).toMatch(/status: \{ in: \["CONFIRMED", "COMPLETED"\] \}/);
    expect(readFileSync("src/components/fleet-section.tsx", "utf8")).toMatch(/Number\(b\.campaign\) - Number\(a\.campaign\)/);
  });
});

describe("home hero tabs (2026-11-12)", () => {
  it("rent tab (search form) stays default and the sale tab copy exists in every language", () => {
    const tabs = readFileSync("src/components/hero-tabs.tsx", "utf8");
    expect(tabs).toMatch(/useState<"rent" \| "sale">\("rent"\)/);
    const en = JSON.parse(readFileSync("messages/en.json", "utf8")).heroTabs;
    for (const l of ["tr", "de", "ru"]) expect(Object.keys(JSON.parse(readFileSync(`messages/${l}.json`, "utf8")).heroTabs).sort(), l).toEqual(Object.keys(en).sort());
    expect(readFileSync("src/app/[locale]/page.tsx", "utf8")).toMatch(/id="search"[\s\S]*<HeroTabs/);
  });
});

describe("travel pages (South Cyprus guide, Driving in South Cyprus)", async () => {
  const { SOUTH_GUIDES } = await import("./travel/south-guide");
  const { DRIVING_SOUTH } = await import("./travel/driving-south");
  const { pagePhotos } = await import("./travel/types");
  const { PHOTOS } = await import("./photos");
  for (const [name, pages] of [["south guide", SOUTH_GUIDES], ["driving south", DRIVING_SOUTH]] as const) {
    it(`${name}: every language has the same sections, item counts and photos`, () => {
      const shape = (p: (typeof pages)["en"]) => JSON.stringify({ photos: pagePhotos(p), sections: p.sections.map((s) => [s.kind, s.id, "items" in s ? s.items.length : 0]), facts: p.facts.items.length, faq: p.faq.items.length });
      for (const l of ["tr", "de", "ru"]) expect(shape(pages[l]), l).toBe(shape(pages.en));
    });
    it(`${name}: photos exist and keep the company crossing rules`, () => {
      for (const k of pagePhotos(pages.en)) expect(PHOTOS[k], k).toBeTruthy();
      for (const l of ["en", "tr", "de", "ru"]) {
        const text = JSON.stringify(pages[l]);
        expect(text, l).toContain("£50");
        expect(text, l).toContain("£21");
        expect(text, l).toMatch(/Metehan|Метехан/);
        expect(text, l).not.toMatch(/Pacific/);
      }
    });
  }
});

describe("OSK after-sales service requests (owner, 2026-11-17)", () => {
  it("queue numbers are shown as S-<n> and parsed from S-1001, s1001 or 1001", async () => {
    const { formatQueueNo, parseQueueNo } = await import("./service");
    expect(formatQueueNo(1001)).toBe("S-1001");
    for (const x of ["S-1001", "s1001", " 1001 ", "S- 1001"]) expect(parseQueueNo(x), x).toBe(1001);
    for (const x of ["", "S-", "12", "abc", "S-10x1", "1001; drop"]) expect(parseQueueNo(x), x).toBeNull();
  });
  it("covers mechanical, body, paint, electrical and wash; mails go to manager@ and info@", async () => {
    const { SERVICE_KINDS, SERVICE_NOTIFY_DEFAULT } = await import("./service");
    expect([...SERVICE_KINDS]).toEqual(["MECHANICAL", "BODY", "PAINT", "ELECTRICAL", "WASH"]);
    expect(SERVICE_NOTIFY_DEFAULT).toEqual(["manager@atollrentacar.com", "info@atollrentacar.com"]);
  });
  it("service copy exists in every language with the same keys, and the form sits in the after-sales section", () => {
    const keys = (o: unknown, p = ""): string[] => Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();
    const en = keys(JSON.parse(readFileSync("messages/en.json", "utf8")).service);
    for (const l of ["tr", "de", "ru"]) expect(keys(JSON.parse(readFileSync(`messages/${l}.json`, "utf8")).service), l).toEqual(en);
    const page = readFileSync("src/app/[locale]/car-sales/page.tsx", "utf8");
    expect(page.indexOf('id="after"')).toBeLessThan(page.indexOf("<ServiceRequestForm"));
    expect(readFileSync("src/server/route-exists.ts", "utf8")).toContain('"service"');
  });
  it("service reservation is linked with icons from the home page, the Car Sales page, the menu and the footer", () => {
    expect(readFileSync("src/components/osk-section.tsx", "utf8")).toContain("<ServiceIconLinks");
    expect(readFileSync("src/app/[locale]/car-sales/page.tsx", "utf8")).toContain("<ServiceIconLinks");
    expect(readFileSync("src/components/main-nav.tsx", "utf8")).toContain("/car-sales#service-request");
    expect(readFileSync("src/components/site-footer.tsx", "utf8")).toContain("/car-sales#service-request");
  });
  it("service pages: 5 slugs x 4 languages with copy, in the sitemap and the route list; mobile bar and rental pages link to the reservation", async () => {
    const { SERVICE_PAGES, SERVICE_COPY } = await import("./car-service");
    expect(SERVICE_PAGES.map((p) => p.slug)).toEqual(["mechanical-repair", "body-repair", "paint", "auto-electrics", "car-wash"]);
    for (const p of SERVICE_PAGES) for (const l of ["en", "tr", "de", "ru"] as const) {
      const c = SERVICE_COPY[p.kind][l];
      for (const v of [c.h1, c.title, c.desc, c.lead, c.what]) expect(v.length, `${p.slug} ${l}`).toBeGreaterThan(10);
      expect(c.desc.length, `${p.slug} ${l} desc`).toBeLessThanOrEqual(160);
    }
    expect(readFileSync("src/server/route-exists.ts", "utf8")).toContain('"car-service"');
    expect(readFileSync("src/server/route-exists.ts", "utf8")).toContain('segments[0] === "car-service"');
    expect(readFileSync("src/app/sitemap.ts", "utf8")).toContain("/car-service");
    expect(readFileSync("src/components/mobile-action-bar.tsx", "utf8")).toContain("/car-sales#service-request");
    expect(readFileSync("src/app/[locale]/cars/[slug]/page.tsx", "utf8")).toContain("<ServiceBanner");
    expect(readFileSync("src/app/[locale]/cars/page.tsx", "utf8")).toContain("<ServiceBanner");
  });
  it("staff e-mail carries the queue number, customer, vehicle and services", async () => {
    const { serviceRequestEmail, customerServiceEmail } = await import("../server/email-templates");
    const m = serviceRequestEmail({ queueNo: "S-1001", name: "Ali Veli", phone: "+90 533 000 00 00", email: "a@b.co", vehicleMake: "Audi A3", vehiclePlate: "ABC123", vehicleYear: 2018, boughtFromOsk: true, services: ["Paint", "Car wash"], details: "Scratch on the door", preferredDate: "2026-12-01", locale: "tr", createdAt: new Date("2026-11-17T08:00:00Z") });
    expect(m.subject).toContain("S-1001");
    for (const x of ["Ali Veli", "+90 533 000 00 00", "ABC123", "Audi A3", "Paint; Car wash", "Scratch on the door", "Bought from OSK Auto : Yes"]) expect(m.text).toContain(x);
    const c = customerServiceEmail({ queueNo: "S-1001", name: "Ali", locale: "ru" }, "https://x/ru/service/1001");
    expect(c.text).toContain("S-1001");
    expect(c.text).toContain("https://x/ru/service/1001");
  });
});
