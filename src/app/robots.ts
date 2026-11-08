import type { MetadataRoute } from "next";
import { connection } from "next/server";

/** Read at request time: SITE_ENV / PUBLIC_SITE_URL come from the container env, not the build. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  const site = process.env.PUBLIC_SITE_URL ?? "https://atollrentacar.com";
  const staging = process.env.SITE_ENV === "staging";
  return staging
    ? { rules: [{ userAgent: "*", disallow: "/" }] }
    : { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/booking/"] }], sitemap: `${site}/sitemap.xml` };
}
