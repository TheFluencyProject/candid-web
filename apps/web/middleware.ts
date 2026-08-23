import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { APP_STORE_URL, MAC_DOWNLOAD_URL, appStoreUrlForTutor, getRedirectUrl } from "./lib/platform";
import { captureServerEvent } from "./lib/posthog-capture";
import { reportInstallClick } from "./lib/install-click";
import { resolve_tutor_by_host, resolve_tutor_by_username, resolve_lesson_by_handle_and_code } from "./lib/resolve-domain";
import { isCanonicalHost } from "./lib/canonical-hosts";
import { pickLocale } from "./lib/i18n-helpers";
import { POSTHOG_ASSETS_HOST, POSTHOG_HOST, POSTHOG_PROXY_PATH } from "./lib/posthog-config";

const intlMiddleware = createMiddleware(routing);

const FIRST_VISIT_COOKIE = "candid_locale_seen";
// Stable anon id for PostHog server-decide + client bootstrap; both sides
// must read the same value or variants drift and the CTA flashes.
const DISTINCT_ID_COOKIE = "candid_did";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function ensureDistinctIdCookie(request: NextRequest, response: NextResponse): void {
  if (request.cookies.has(DISTINCT_ID_COOKIE)) return;
  response.cookies.set(DISTINCT_ID_COOKIE, crypto.randomUUID(), {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
}

// ── App Store redirect map (moved from next.config.js for UA branching) ──

interface RedirectEntry {
  permanent: boolean;
  ppid?: string;
}

const EXACT_REDIRECTS: Record<string, RedirectEntry> = {
  "/join": { permanent: true },
  "/app": { permanent: true },
  "/yooooooooooooooooooooooo": { permanent: true },
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
};

function resolveAppStoreRedirect(
  pathname: string,
): { dest: string; status: number; appClip?: boolean } | null {
  // Mac desktop DMG — must precede the /download/* → App Store catch-all below.
  if (pathname === "/download/mac") {
    return { dest: MAC_DOWNLOAD_URL, status: 307 };
  }
  const exact = EXACT_REDIRECTS[pathname];
  if (exact) {
    const appUrl = exact.ppid ? `${APP_STORE_URL}?ppid=${exact.ppid}` : APP_STORE_URL;
    return { dest: appUrl, status: exact.permanent ? 308 : 307 };
  }
  // Catch-all: /download or /download/:slug → that tutor's Custom Product Page when they have
  // one, else the plain App Store URL.
  // App Clip funnel disabled for now — the `appClip` flag below is commented out so these
  // always redirect to the App Store instead of rendering the App Clip landing page.
  if (pathname === "/download" || pathname.startsWith("/download/")) {
    const slug = pathname.slice("/download/".length); // "" for bare /download
    return { dest: appStoreUrlForTutor(slug), status: 307 /* , appClip: true */ };
  }
  return null;
}

// iPhone iOS major from the UA ("iPhone OS 18_5" → 18), or 0 when not an iPhone.
// Only used by the App Clip funnel, which is disabled for now — uncomment with it.
// function iphoneIOSMajor(ua: string): number {
//   const m = ua.match(/iPhone OS (\d+)_/);
//   return m ? parseInt(m[1], 10) : 0;
// }

// Accept-Language only — no country. The two callers below are a rewrite (locale never
// appears in the URL) and a vanity redirect, neither of which leaves a way back to English,
// so geo must not widen who they catch. Only the landing check does, and it's cookie-gated.
function prefersKorean(request: NextRequest): boolean {
  return pickLocale(request.headers.get("accept-language")) === "ko";
}

// Single-segment paths that are real routes (or locale prefixes) — never treat these as a
// username, so a username lookup can't shadow a page. App Store vanity words are handled
// above; api/_next/videos/lesson/g are excluded by the matcher.
const RESERVED_USERNAME_PATHS = new Set([
  "classic", "company-info", "privacy", "terms", "tutor", "youtube-videos",
  "download", "g", "lesson", "qr", "teach", "videos", "en", "ko",
]);

// Routes that render their own <html> and are excluded from the intl matcher below, but still
// need candid_did stamped — AnonAnalytics reads that cookie to keep a visitor one PostHog person.
const ANON_ANALYTICS_ROUTES = ["/lesson", "/videos", "/desktop", "/g"];


export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // ── PostHog first-party proxy: /lx/* → PostHog ──
  // Ad blockers block *.posthog.com by domain, so the browser SDK only ever names our origin.
  // Must stay ABOVE the custom-domain branch, which 404s non-canonical hosts — tutor domains
  // serve the same pages and need analytics too.
  if (pathname.startsWith(`${POSTHOG_PROXY_PATH}/`)) {
    const upstream_path = pathname.slice(POSTHOG_PROXY_PATH.length);
    // /static/ + /array/ are CDN bundles; everything else is ingestion/flags.
    const upstream = upstream_path.startsWith("/static/") || upstream_path.startsWith("/array/")
      ? POSTHOG_ASSETS_HOST
      : POSTHOG_HOST;
    return NextResponse.rewrite(new URL(upstream_path + request.nextUrl.search, upstream));
  }

  // ── candid_did for the non-intl routes (/lesson, /videos, /desktop, /g) ──
  // These own their <html> and are excluded from the intl matcher, so they get their own matcher
  // entries and return here: they must never reach intlMiddleware (it would add a locale prefix).
  // Must stay ABOVE the custom-domain branch, which rewrites ANY path on a tutor domain to that
  // tutor's page. Without the cookie, AnonAnalytics falls back to a fresh UUID per render and
  // posthog register()s it — minting a new person on every single load.
  if (ANON_ANALYTICS_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const did = request.cookies.get(DISTINCT_ID_COOKIE)?.value ?? crypto.randomUUID();
    // Mirror onto the request so this render reads the same id it's about to be issued.
    request.cookies.set(DISTINCT_ID_COOKIE, did);
    const response = NextResponse.next({ request });
    response.cookies.set(DISTINCT_ID_COOKIE, did, {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
    return response;
  }

  // ── Custom-domain rewrite ──
  // Strip port + lowercase: host headers vary by proxy.
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!isCanonicalHost(host)) {
    const slug = await resolve_tutor_by_host(host);
    if (!slug) return new NextResponse("Not found", { status: 404 });

    // Rewrite (not redirect) — URL must stay on the custom domain.
    const locale = prefersKorean(request) ? "ko" : "en";
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/tutor/${slug}`;
    return NextResponse.rewrite(url);
  }

  // ── Scanned QR → App Store (tracked) ──
  // Deliberately NOT /download/*: that prefix is a registered App Clip Experience, so scanning it
  // pops the clip card before any redirect can run. /qr is unregistered, so it goes straight to
  // the store. `sid` is the distinct_id of the desktop session that rendered the QR, so the scan
  // joins that visitor's funnel even though it arrives from a different device.
  if (pathname === "/qr" || pathname.startsWith("/qr/")) {
    const slug = pathname.slice("/qr/".length); // "" for bare /qr
    const params = request.nextUrl.searchParams;
    event.waitUntil(
      captureServerEvent("qr_scanned", params.get("sid") ?? crypto.randomUUID(), {
        surface: params.get("s") ?? "unknown",
        tutor_slug: slug,
        lesson_id: params.get("l"),
        $current_url: request.url,
      }),
    );
    event.waitUntil(reportInstallClick(request, { handle: slug, source: "qr", lessonId: params.get("l") }));
    const ua = request.headers.get("user-agent") ?? "";
    return NextResponse.redirect(getRedirectUrl(ua, appStoreUrlForTutor(slug)), { status: 307 });
  }

  // ── App Store / waitlist redirects (UA-aware) ──
  const redirect = resolveAppStoreRedirect(pathname);
  if (redirect) {
    const ua = request.headers.get("user-agent") ?? "";
    // App Clip funnel — DISABLED for now. When enabled, a /download or /download/<slug> visit on a
    // clip-capable iPhone (iOS 18+, the clip's min target) renders the landing page so Safari
    // surfaces the App Clip card from its apple-itunes-app meta tag — tapping the card opens the
    // clip. Everything else (older iOS, Android, desktop, and the ppid product-page vanity links)
    // falls through to the App Store redirect below. iOS may also auto-present the clip from a
    // registered Experience or QR/camera before this ever runs. Uncomment to re-enable.
    // if (redirect.appClip && iphoneIOSMajor(ua) >= 18) {
    //   return NextResponse.next();
    // }
    // Only the per-tutor /download/<slug> form is attributable; bare /download, /download/mac
    // and the vanity EXACT_REDIRECTS carry no tutor handle.
    if (pathname.startsWith("/download/") && pathname !== "/download/mac") {
      event.waitUntil(reportInstallClick(request, {
        handle: pathname.slice("/download/".length),
        source: "download",
      }));
    }
    const dest = getRedirectUrl(ua, redirect.dest);
    return NextResponse.redirect(dest, { status: redirect.status });
  }

  // ── Username vanity redirect: joincandid.co/{username} → /tutor/{slug} ──
  // Runtime DB lookup (replaces the old hardcoded next.config redirects). Single-segment
  // paths only; reserved words are skipped so a username can't shadow a real route.
  const locale_stripped = pathname.replace(/^\/(?:en|ko)(?=\/|$)/, "");
  const segments = locale_stripped.split("/").filter(Boolean);

  // ── Tutor referral deep link: joincandid.co/redirects/<handle> → App Store ──
  // Any handle works with no code change; appStoreUrlForTutor appends ?ppid=<x> only when that
  // tutor has a Custom Product Page. Must precede the lesson-share branch below — a 6-char handle
  // (e.g. "hayden") would otherwise match its share-code regex. 307: handles/ppids can change.
  if (segments.length === 2 && segments[0] === "redirects") {
    const ua = request.headers.get("user-agent") ?? "";
    event.waitUntil(reportInstallClick(request, { handle: segments[1], source: "redirects" }));
    return NextResponse.redirect(
      getRedirectUrl(ua, appStoreUrlForTutor(segments[1])),
      { status: 307 },
    );
  }

  if (segments.length === 1 && !RESERVED_USERNAME_PATHS.has(segments[0])) {
    const slug = await resolve_tutor_by_username(segments[0]);
    if (slug) {
      // 307 (temporary): usernames can change, so browsers must not cache the mapping.
      const wants_ko = pathname.startsWith("/ko/") || prefersKorean(request);
      const url = request.nextUrl.clone();
      url.pathname = wants_ko ? `/ko/tutor/${slug}` : `/tutor/${slug}`;
      return NextResponse.redirect(url, 307);
    }
  }

  // ── Lesson short-URL redirect: joincandid.co/{handle}/{code} → /lesson/{lesson_id} ──
  // Two-segment paths whose 2nd segment matches the 6-char share_code shape. The regex
  // gate avoids a backend call on every random two-segment path (crawlers, typos). The
  // /lesson route is locale-agnostic (excluded from the matcher), so no locale prefix.
  if (
    segments.length === 2 &&
    !RESERVED_USERNAME_PATHS.has(segments[0]) &&
    /^[a-z0-9]{6}$/.test(segments[1])
  ) {
    const lesson_id = await resolve_lesson_by_handle_and_code(segments[0], segments[1]);
    if (lesson_id) {
      // 307 (temporary): share codes / usernames can change, so don't cache the mapping.
      const url = request.nextUrl.clone();
      url.pathname = `/lesson/${lesson_id}`;
      return NextResponse.redirect(url, 307);
    }
  }

  // ── Locale detection ──
  const hasSeenCookie = request.cookies.has(FIRST_VISIT_COOKIE);
  const isRoot = pathname === "/";

  // The only place the country is consulted — a redirect that leaves /ko in the URL and
  // sets the cookie, so a mis-detected visitor can get back to English and stay there.
  const wants_korean =
    isRoot &&
    !hasSeenCookie &&
    pickLocale(
      request.headers.get("accept-language"),
      request.headers.get("x-vercel-ip-country"),
    ) === "ko";

  if (wants_korean) {
    const url = request.nextUrl.clone();
    url.pathname = "/ko";
    const response = NextResponse.redirect(url);
    response.cookies.set(FIRST_VISIT_COOKIE, "1", {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
    ensureDistinctIdCookie(request, response);
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
  ensureDistinctIdCookie(request, response);
  return response;
}

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - _next (Next.js internals)
  // - /videos (video share pages, no i18n needed)
  // - /lesson (lesson share pages, no i18n needed)
  // - /desktop (Mac download page — detects locale itself, like /download)
  // - Static files (images, fonts, etc.)
  //
  // /lx/* needs its own entry: the dotted-file exclusion above would drop the PostHog CDN
  // bundles (/lx/static/recorder.js) before the proxy branch could ever run.
  //
  // The excluded routes then get their own entries so middleware still runs on them and can stamp
  // candid_did — they stay out of the lookahead above so they never reach intlMiddleware, and the
  // ANON_ANALYTICS_ROUTES branch returns before anything else can touch them.
  matcher: [
    "/((?!api|_next|videos|lesson|desktop|g/|.*\\..*).*)",
    "/lx/:path*",
    "/lesson/:path*",
    "/videos/:path*",
    "/desktop/:path*",
    "/g/:path*",
  ],
};
