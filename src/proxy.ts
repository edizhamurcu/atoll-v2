import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

export default function proxy(req: NextRequest) {
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
  return intl(req);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|media|brand|.*\\..*).*)",
};
