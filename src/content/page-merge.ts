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
