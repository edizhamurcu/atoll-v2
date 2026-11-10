import tr from "./tr";
import de from "./de";
import ru from "./ru";
import { ABOUT } from "./about";

/** Translations of the content pages migrated from WordPress (the English source stays in the Page table). */
export type PageTranslation = { title: string; html: string; metaDescription?: string };
export type PageTranslations = Record<string, PageTranslation>;

const ALL: Record<string, PageTranslations> = { tr: { ...tr, "about-us": ABOUT.tr }, de: { ...de, "about-us": ABOUT.de }, ru: { ...ru, "about-us": ABOUT.ru } };
/** English pages owned by code instead of the WP text in the Page table. */
const EN: PageTranslations = { "about-us": ABOUT.en };

export const pageTranslation = (slug: string, locale: string): PageTranslation | null => (locale === "en" ? EN[slug] : ALL[locale]?.[slug]) ?? null;
/** Locales (besides English) in which a page is available. */
export const translatedLocales = (slug: string) => Object.keys(ALL).filter((l) => ALL[l][slug]);
export const translatedSlugs = (locale: string) => Object.keys(ALL[locale] ?? {});
