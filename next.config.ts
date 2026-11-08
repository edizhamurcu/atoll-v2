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
  images: { formats: ["image/avif", "image/webp"], localPatterns: [{ pathname: "/media/**" }, { pathname: "/brand/**" }, { pathname: "/photos/**" }] },
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Every legacy WordPress URL keeps working (301) so rankings and bookmarks survive the move.
    const same = "about-north-cyprus|north-cyprus-guide|special-offers|rental-terms|rental-agreement|delivery-charges|fuel-options|extra-insurance|driving-in-south-cyprus|larnaca-airport-transfer-to-girne-kyrenia-north-cyprus";
    return [
      { source: `/:slug(${same})`, destination: "/en/:slug", permanent: true },
      { source: "/about-us-2", destination: "/en/about-us", permanent: true },
      { source: "/privacy-policy-2", destination: "/en/privacy-policy", permanent: true },
      { source: "/explore-vehicles-2", destination: "/en/car-prices", permanent: true },
      { source: "/explore-vehicles", destination: "/en/cars", permanent: true },
      { source: "/our-cars", destination: "/en/cars", permanent: true },
      { source: "/shop", destination: "/en/cars", permanent: true },
      { source: "/product/:slug*", destination: "/en/cars", permanent: true },
      { source: "/product-category/:slug*", destination: "/en/cars", permanent: true },
      { source: "/contact", destination: "/en/contact", permanent: true },
      { source: "/home-page", destination: "/en", permanent: true },
      { source: "/:p(cart-2|checkout-2|my-account|my-account-2|login|password-recovery|your-order-details)", destination: "/en", permanent: true },
      { source: "/wp-sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/sitemap_index.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/feed", destination: "/en/blog", permanent: true },
      { source: "/wp-login.php", destination: "/", permanent: false },
      { source: "/wp-admin/:path*", destination: "/", permanent: false },
    ];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
