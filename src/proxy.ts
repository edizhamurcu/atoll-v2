import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { dbRouteExists } from "./server/route-exists";

const intl = createMiddleware(routing);
const LOCALES = new Set<string>(routing.locales);

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) {
    // Fast gate: no session cookie -> login. The session itself is validated server-side on every request.
    if (pathname !== "/admin/login" && !req.cookies.has("atoll_admin")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  // Real 404 status for unknown content/car slugs (streamed pages can no longer change their status).
  const [, locale, ...rest] = pathname.split("/");
  if (LOCALES.has(locale) && rest.length > 0 && rest.every(Boolean) && rest[0] !== "__404") {
    const exists = await dbRouteExists(rest);
    if (exists === false) {
      // A rewrite cannot change the status of a streamed page, so render the branded 404 page
      // (the [slug] route rejects "__404") and return it with a real 404 status.
      const html = await fetch(`http://127.0.0.1:${process.env.PORT ?? 3000}/${locale}/__404`, { headers: { accept: "text/html" } })
        .then((r) => r.text())
        .catch(() => "<!doctype html><title>404</title><h1>Page not found</h1>");
      return new NextResponse(html, { status: 404, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", "cache-control": "no-store" } });
    }
  }
  return intl(req);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|media|brand|photos|.*\\..*).*)",
};
