import { plain, posts } from "@/content/blog";
import { SITE } from "@/lib/site";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS 2.0 feed of the travel blog (static content, built at deploy time). */
export function GET() {
  const items = posts()
    .map((p) => {
      const url = `${SITE.url}/en/blog/${p.slug}`;
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(`${p.published}T09:00:00Z`).toUTCString()}</pubDate><description>${esc(p.description)}</description>${p.tags.map((t) => `<category>${esc(t)}</category>`).join("")}<content:encoded><![CDATA[${plain(p.body).slice(0, 600)}…]]></content:encoded></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>North Cyprus Travel Blog | ${esc(SITE.name)}</title><link>${SITE.url}/en/blog</link><atom:link href="${SITE.url}/blog/feed.xml" rel="self" type="application/rss+xml"/><description>Travel tips, road trips, beaches and practical advice for visiting North Cyprus.</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
