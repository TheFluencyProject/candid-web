import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { APP_STORE_URL, getRedirectUrl } from "./lib/platform";

const intlMiddleware = createMiddleware(routing);

const FIRST_VISIT_COOKIE = "candid_locale_seen";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// ── App Store redirect map (moved from next.config.js for UA branching) ──

interface RedirectEntry {
  permanent: boolean;
  ppid?: string;
}

const EXACT_REDIRECTS: Record<string, RedirectEntry> = {
  "/join": { permanent: true },
  "/app": { permanent: true },
  "/download": { permanent: true },
  "/studywithus": { permanent: true },
  "/learnwithus": { permanent: true },
  "/startup": { permanent: true },
  "/beauty": { permanent: true },
  "/wellness": { permanent: true },
  "/basketball": { permanent: true },
  "/startups": { permanent: true, ppid: "c038ad6e-6323-481e-95fd-2dadeb0bd04d" },
  "/englishmode": { permanent: true, ppid: "a34b9b94-7d2a-4fac-b792-6e59fb0e5e59" },
  "/business": { permanent: true, ppid: "a5bb8fc4-a398-442f-b401-92c2cc1e050a" },
  "/news": { permanent: true, ppid: "86959fbf-bcba-4bea-829f-5b7d73270854" },
  "/redirects/adam": { permanent: false, ppid: "a5bb8fc4-a398-442f-b401-92c2cc1e050a" },
  "/redirects/mia": { permanent: false, ppid: "86959fbf-bcba-4bea-829f-5b7d73270854" },
  "/download/english-adam": { permanent: false, ppid: "a5bb8fc4-a398-442f-b401-92c2cc1e050a" },
  "/download/korean-mia": { permanent: false, ppid: "86959fbf-bcba-4bea-829f-5b7d73270854" },
};

function resolveAppStoreRedirect(pathname: string): { dest: string; status: number } | null {
  const exact = EXACT_REDIRECTS[pathname];
  if (exact) {
    const appUrl = exact.ppid ? `${APP_STORE_URL}?ppid=${exact.ppid}` : APP_STORE_URL;
    return { dest: appUrl, status: exact.permanent ? 308 : 307 };
  }
  // Catch-all: /download/:slug (any slug not matched above)
  if (pathname.startsWith("/download/")) {
    return { dest: APP_STORE_URL, status: 307 };
  }
  return null;
}

// Detect Korean from Accept-Language. Anything else → leave on default (`en`).
function prefersKorean(request: NextRequest): boolean {
  const header = request.headers.get("accept-language") ?? "";
  const primary = header.split(",")[0]?.trim().toLowerCase() ?? "";
  return primary.startsWith("ko");
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── App Store / waitlist redirects (UA-aware) ──
  const redirect = resolveAppStoreRedirect(pathname);
  if (redirect) {
    const ua = request.headers.get("user-agent") ?? "";
    const dest = getRedirectUrl(ua, redirect.dest);
    return NextResponse.redirect(dest, { status: redirect.status });
  }

  // ── Locale detection ──
  const hasSeenCookie = request.cookies.has(FIRST_VISIT_COOKIE);
  const isRoot = pathname === "/";

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
