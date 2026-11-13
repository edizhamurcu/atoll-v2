import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS only (Cloudflare + origin). No includeSubDomains: other atollrentacar.com hosts are not ours to force.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  // Scripts stay 'unsafe-inline' (Next.js inline bootstrap without nonces under cacheComponents); the policy still
  // blocks plugins, <base> hijacking, foreign form posts, framing and loading scripts/frames from other origins.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com",
      "frame-src https://www.google.com https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/**
 * Crawlers that get title/description/canonical/hreflang in <head> of the raw HTML (blocking metadata) instead of
 * streamed into <body>. Next's default list (Bing, social previews, other Google bots) plus Googlebot and the AI
 * search/answer crawlers, which read raw HTML without running JavaScript (GEO).
 */
const HTML_LIMITED_BOTS =
  /[\w-]+-Google|Google-[\w-]+|Googlebot|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|PerplexityBot|Perplexity-User|CCBot|Amazonbot|meta-externalagent|meta-externalfetcher|cohere-ai|Bytespider|YouBot|DuckAssistBot|MistralAI-User|Diffbot|PetalBot/i;

const nextConfig: NextConfig = {
  htmlLimitedBots: HTML_LIMITED_BOTS,
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"], localPatterns: [{ pathname: "/media/**" }, { pathname: "/brand/**" }, { pathname: "/photos/**" }, { pathname: "/api/v1/stock/photo/**" }] },
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Every legacy WordPress URL keeps working (301) so rankings and bookmarks survive the move.
    const same = "about-north-cyprus|north-cyprus-guide|special-offers|rental-terms|delivery-charges|fuel-options|extra-insurance|driving-in-south-cyprus|larnaca-airport-transfer-to-girne-kyrenia-north-cyprus";
    return [
      // Rental agreement merged into rental terms (one page, agreement at #agreement).
      { source: "/:locale(en|tr|de|ru)/rental-agreement", destination: "/:locale/rental-terms#agreement", permanent: true },
      { source: "/rental-agreement", destination: "/en/rental-terms#agreement", permanent: true },
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
