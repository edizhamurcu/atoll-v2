import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/onest";
import "../globals.css";
import type { Metadata } from "next";
import { seoDescription } from "@/lib/seo";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileActionBar } from "@/components/mobile-action-bar";
import { RevealObserver } from "@/components/reveal-observer";
import { SITE, waLink } from "@/lib/site";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const site = process.env.PUBLIC_SITE_URL ?? "https://atollrentacar.com";
  return {
    metadataBase: new URL(site),
    title: { default: t("title"), template: `%s | Atoll Rent A Car` },
    description: seoDescription(t("description")),
    alternates: { canonical: `/${locale}`, languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])), "x-default": "/en" } },
    openGraph: { siteName: "Atoll Rent A Car", locale, type: "website", images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Atoll Rent A Car — car rental in North Cyprus" }] },
    twitter: { card: "summary_large_image", images: ["/brand/og.png"] },
    formatDetection: { telephone: true },
    applicationName: "Atoll Rent A Car",
  };
}

export const viewport = { themeColor: "#0d3440", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return (
    <html lang={locale}>
      <body className="min-h-dvh antialiased">
        {/* React reveals streamed Suspense content on the next animation frame ($RC -> requestAnimationFrame($RV)).
            Where frames are not painted (embedded/in-app webviews, some background loads) that frame never comes and
            fallbacks such as the search skeleton stay forever. Flush any still-queued reveal after 250 ms; a no-op when
            React already did it. */}
        <script dangerouslySetInnerHTML={{ __html: STREAM_REVEAL_FALLBACK }} />
        <NextIntlClientProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
            {(await getTranslations({ locale, namespace: "common" }))("skip")}
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <RevealObserver />
          <MobileActionBar
            labels={{
              find: (await getTranslations({ locale, namespace: "nav" }))("book"),
              whatsapp: "WhatsApp",
              waHref: waLink(),
              phone: SITE.phone,
              waSaleHref: waLink((await getTranslations({ locale, namespace: "sales" }))("waText"), SITE.whatsapp),
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

const STREAM_REVEAL_FALLBACK =
  // $RV also schedules hydration of each revealed boundary with requestAnimationFrame(_reactRetry);
  // swap rAF for a timer while flushing so those boundaries hydrate too (otherwise effects never run).
  "(function(){var n=0,t=setInterval(function(){var q=window.$RB,v=window.$RV;if(q&&q.length&&typeof v==='function'){var r=window.requestAnimationFrame;window.requestAnimationFrame=function(f){return setTimeout(f,0)};try{v(q)}catch(e){}finally{window.requestAnimationFrame=r}}if(++n>=60)clearInterval(t)},250)})();";
