import "server-only";
import { connection } from "next/server";
import { db } from "@/lib/db";

export async function getPage(slug: string) {
  await connection();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  return db.page.findUnique({ where: { slug } });
}

export async function listPages() {
  await connection();
  return db.page.findMany({ where: { showInSitemap: true }, select: { slug: true, title: true, updatedAt: true }, orderBy: { slug: "asc" } });
}

/** Rental terms are written as questions/headings: expose "?" headings as FAQ for rich results & AI answers. */
export function faqFromHtml(html: string) {
  const out: { q: string; a: string }[] = [];
  const re = /<h2>(.*?)<\/h2>([\s\S]*?)(?=<h2>|$)/g;
  for (const m of html.matchAll(re)) {
    const q = m[1].replace(/<[^>]+>/g, "").trim();
    const a = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (q.endsWith("?") && a) out.push({ q, a });
  }
  return out;
}

export function plainText(html: string, max = 160) {
  const t = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : t;
}
