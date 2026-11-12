import type { TravelPage } from "../types";
import en from "./en";
import tr from "./tr";
import de from "./de";
import ru from "./ru";

export const SOUTH_GUIDES: Record<string, TravelPage> = { en, tr, de, ru };
export const southGuide = (locale: string): TravelPage => SOUTH_GUIDES[locale] ?? en;
