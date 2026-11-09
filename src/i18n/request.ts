import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  // Validate explicit locales too: a malformed path segment must 404, not reach the dynamic import below.
  const candidate = locale ?? (await rootParams.locale());
  if (!hasLocale(routing.locales, candidate)) notFound();
  locale = candidate;
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default, timeZone: "Asia/Famagusta" };
});
