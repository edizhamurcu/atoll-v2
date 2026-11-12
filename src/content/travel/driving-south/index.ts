import type { TravelPage } from "../types";
import en from "./en";
import tr from "./tr";
import de from "./de";
import ru from "./ru";

export const DRIVING_SOUTH: Record<string, TravelPage> = { en, tr, de, ru };
export const drivingSouth = (locale: string): TravelPage => DRIVING_SOUTH[locale] ?? en;
