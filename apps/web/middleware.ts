import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const FIRST_VISIT_COOKIE = "candid_locale_seen";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Detect Korean from Accept-Language. Anything else → leave on default (`en`).
function prefersKorean(request: NextRequest): boolean {
  const header = request.headers.get("accept-language") ?? "";
  // Take the first tag (highest priority) and see if it starts with "ko".
  const primary = header.split(",")[0]?.trim().toLowerCase() ?? "";
  return primary.startsWith("ko");
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSeenCookie = request.cookies.has(FIRST_VISIT_COOKIE);
  const isRoot = pathname === "/";

  // First visit, landing on `/`, browser prefers Korean → one-time redirect.
  if (isRoot && !hasSeenCookie && prefersKorean(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/ko";
    const response = NextResponse.redirect(url);
    response.cookies.set(FIRST_VISIT_COOKIE, "1", {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
    return response;
  }

  const response = intlMiddleware(request);
  // Mark as seen on any successful page response so future `/` visits
  // (including manual URL edits to drop `/ko`) skip the redirect.
  if (!hasSeenCookie) {
    response.cookies.set(FIRST_VISIT_COOKIE, "1", {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - _next (Next.js internals)
  // - /videos (video share pages, no i18n needed)
  // - /lesson (lesson share pages, no i18n needed)
  // - Static files (images, fonts, etc.)
  matcher: ["/((?!api|_next|videos|lesson|g/|.*\\..*).*)"],
};
