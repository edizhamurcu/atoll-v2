import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.PUBLIC_SITE_URL ?? "https://atollrentacar.com";
  const staging = process.env.SITE_ENV === "staging";
  return staging
    ? { rules: [{ userAgent: "*", disallow: "/" }] }
    : { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/booking/"] }], sitemap: `${site}/sitemap.xml` };
}
