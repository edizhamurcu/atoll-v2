import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { TravelGuideView } from "@/components/travel-guide";
import { photo, photoAlt } from "@/content/photos";
import { drivingSouth } from "@/content/travel/driving-south";

const PATH = "/driving-in-south-cyprus";
const DRIVING_SOUTH_UPDATED = "2026-11-12";

export async function generateMetadata({ params }: PageProps<"/[locale]/driving-in-south-cyprus">): Promise<Metadata> {
  const { locale } = await params;
  const g = drivingSouth(locale);
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

export default async function DrivingSouthPage({ params }: PageProps<"/[locale]/driving-in-south-cyprus">) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  return <TravelGuideView page={drivingSouth(locale)} locale={locale} path={PATH} updated={DRIVING_SOUTH_UPDATED} nav="driving" />;
}
