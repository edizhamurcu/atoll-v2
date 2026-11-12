import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { TravelGuideView } from "@/components/travel-guide";
import { photo, photoAlt } from "@/content/photos";
import { southGuide } from "@/content/travel/south-guide";

const PATH = "/south-cyprus-guide";
const SOUTH_GUIDE_UPDATED = "2026-11-12";

export async function generateMetadata({ params }: PageProps<"/[locale]/south-cyprus-guide">): Promise<Metadata> {
  const { locale } = await params;
  const g = southGuide(locale);
  const hero = photo(g.heroPhoto);
  const url = `/${locale}${PATH}`;
  return {
    title: g.meta.title,
    description: g.meta.description,
    alternates: { canonical: url, languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${PATH}`])), "x-default": `/en${PATH}` } },
    openGraph: { title: g.meta.title, description: g.meta.description, url, type: "article", images: [{ url: hero.src, width: hero.w, height: hero.h, alt: photoAlt(g.heroPhoto, locale) }] },
    twitter: { card: "summary_large_image", images: [hero.src] },
  };
}

export default async function SouthGuidePage({ params }: PageProps<"/[locale]/south-cyprus-guide">) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  return <TravelGuideView page={southGuide(locale)} locale={locale} path={PATH} updated={SOUTH_GUIDE_UPDATED} nav="south" />;
}
