/**
 * Pages merged into another page. /rental-agreement now lives at the bottom of /rental-terms (#agreement):
 * the old URL 308-redirects there (next.config.ts), it is left out of the sitemap and menus, and links to it
 * inside page content are rewritten.
 */
export const MERGED_INTO: Record<string, { into: string; anchor: string }> = {
  "rental-agreement": { into: "rental-terms", anchor: "agreement" },
};
export const HOSTS: Record<string, string[]> = { "rental-terms": ["rental-agreement"] };

/** Points links to merged pages at their new place (/xx/rental-agreement → /xx/rental-terms#agreement). */
export function rewriteMergedLinks(html: string): string {
  return html.replace(/href="\/(en|tr|de|ru)\/([a-z0-9-]+)"/g, (m, l: string, s: string) => {
    const t = MERGED_INTO[s];
    return t ? `href="/${l}/${t.into}#${t.anchor}"` : m;
  });
}

/** Removes the host page's closing "read the rental agreement" section: the agreement is now on the same page. */
export function dropAgreementTeaser(html: string): string {
  return html.replace(/<h2>[^<]*<\/h2>\s*<p>(?:(?!<h2>)[\s\S])*?rental-(?:agreement|terms#agreement)(?:(?!<h2>)[\s\S])*?<\/p>\s*$/, "");
}

const UPPER = /^[^a-zà-ÿа-яёçğışöü]{8,}$/;
/** German nouns keep their capital letters; these are the only all-caps titles in the German agreement. */
const DE_TITLES: Record<string, string> = {
  "bedingungen für den erwerb von zusatzleistungen": "Bedingungen für den Erwerb von Zusatzleistungen",
  "vollkasko mit selbstbeteiligung (c.d.w.)": "Vollkasko mit Selbstbeteiligung (C.D.W.)",
};
const sentence = (s: string, locale: string) => {
  const low = s.toLocaleLowerCase(locale).replace("conditons", "conditions");
  if (locale === "de") return DE_TITLES[low] ?? s;
  return low.charAt(0).toLocaleUpperCase(locale) + low.slice(1).replace(/\(c\.d\.w\.\)/g, "(C.D.W.)");
};

/**
 * The agreement text came from the old site as bold paragraphs, an underlined title, a stray <ol> and capitals.
 * On the merged page every section title becomes an <h2>, the same font and size as the rental-terms headings.
 */
export function normalizeAgreement(html: string, locale: string): string {
  return html
    .replace(/<hr\s*\/?>/g, "")
    .replace(/<p><strong><u>[^<]*<\/u><\/strong><\/p>/g, "") // "RENTAL AGREEMENT": the section already has this heading
    .replace(/<p><strong>(\d+\.\s*[^<]+?)\s*<\/strong><\/p>/g, "<h2>$1</h2>")
    .replace(/<ol>\s*<li>([^<.]{3,30})<\/li>\s*<\/ol>/g, "<h2>7. $1</h2>") // "Dispute" was a one-item list
    .replace(/<p>([^<]{3,40}):<\/p>/g, "<h2>$1</h2>") // "Terms and Conditions:"
    .replace(/<p>(?:<strong>)?([^<]{8,120}?)(?:<\/strong>)?<\/p>/g, (m, t: string) => (UPPER.test(t.trim()) ? `<h2>${sentence(t.trim(), locale)}</h2>` : m));
}
