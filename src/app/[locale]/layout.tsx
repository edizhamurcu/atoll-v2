import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/onest";
import "../globals.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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
    description: t("description"),
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
        <NextIntlClientProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
