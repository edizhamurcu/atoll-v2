import type { GuideContent } from "./types";
import en from "./en";
import tr from "./tr";
import de from "./de";
import ru from "./ru";

export const GUIDES: Record<string, GuideContent> = { en, tr, de, ru };
export const guide = (locale: string): GuideContent => GUIDES[locale] ?? en;
export type { GuideContent };
