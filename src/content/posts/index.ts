import type { Post } from "../blog";
import en from "./en";
import tr from "./tr";
import de from "./de";
import ru from "./ru";

/** Posts per language. Every language has the same slugs (same article), so hreflang links them. */
export const POSTS_BY_LOCALE: Record<string, Post[]> = { en, tr, de, ru };
