import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"], localPatterns: [{ pathname: "/media/**" }, { pathname: "/brand/**" }] },
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Legacy WordPress URLs -> new routes (keeps SEO and bookmarks).
    return [
      { source: "/explore-vehicles", destination: "/en/cars", permanent: true },
      { source: "/explore-vehicles-2", destination: "/en/cars", permanent: true },
      { source: "/our-cars", destination: "/en/cars", permanent: true },
      { source: "/shop", destination: "/en/cars", permanent: true },
      { source: "/rental-terms", destination: "/en/rental-terms", permanent: true },
      { source: "/rental-agreement", destination: "/en/rental-terms", permanent: true },
      { source: "/contact", destination: "/en/contact", permanent: true },
      { source: "/about-us-2", destination: "/en", permanent: true },
      { source: "/delivery-charges", destination: "/en/rental-terms#delivery", permanent: true },
      { source: "/fuel-options", destination: "/en/rental-terms#fuel", permanent: true },
      { source: "/extra-insurance", destination: "/en/rental-terms#insurance", permanent: true },
      { source: "/driving-in-south-cyprus", destination: "/en/rental-terms#south-cyprus", permanent: true },
      { source: "/product/:slug", destination: "/en/cars", permanent: true },
      { source: "/wp-login.php", destination: "/", permanent: false },
    ];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
