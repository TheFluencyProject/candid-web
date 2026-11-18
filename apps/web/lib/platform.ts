import { detectInAppBrowser } from "./in-app-browser";

export const APP_STORE_URL = "https://apps.apple.com/app/id6754859158";
// Chrome Web Store listing of the Candid extension (not linked anywhere yet).
export const CHROME_EXTENSION_STORE_URL =
  "https://chromewebstore.google.com/detail/bgeacdmeaafjkeioebfacgleachdidhc";
// macOS DMG "latest" alias — the fastlane mac_release lane overwrites this key each release.
export const MAC_DOWNLOAD_URL =
  "https://tfp-app-downloads.s3.us-west-1.amazonaws.com/mac/Candid.dmg";
// Candid's Apple-provided ("basic") App Clip link — surfaces the clip card on iOS.
export const APP_CLIP_URL = "https://appclip.apple.com/id?p=co.thefluencyproject.bloom-ios.Clip";

export function isIOSUserAgent(ua: string): boolean {
  return /iPhone|iPad|iPod/i.test(ua);
}

export function isAndroidUserAgent(ua: string): boolean {
  return /Android/.test(ua);
}

// Candid is iOS-only, so an Android store hop (a scanned desktop QR, /download/<slug>, /app, a shared
// video link…) lands on one of our pages with the waitlist form open instead of a dead App Store page.
// DownloadQRInterceptor opens the form from ?waitlist=<tutor slug | 1> — the same form an Android
// "Study" tap opens, so every Android signup lands in one list. `from` names the link, for PostHog.
// Lesson → that lesson's page; tutor → their page; anything else → home.
export function androidWaitlistPath({ from, tutor_slug, lesson_id }: {
  from: string;
  tutor_slug?: string | null;
  lesson_id?: string | null;
}): string {
  const path = lesson_id
    ? `/lesson/${encodeURIComponent(lesson_id)}`
    : tutor_slug ? `/tutor/${encodeURIComponent(tutor_slug)}` : "/";
  return `${path}?${new URLSearchParams({ waitlist: tutor_slug || "1", from })}`;
}

// TikTok specifically: the one in-app browser with no known escape to the system browser, so
// callers have to degrade to "search the App Store yourself" instead of routing to a store link.
// Every other social webview is handled by escapeToNativeBrowser.
export function isRestrictedInAppBrowser(): boolean {
  return detectInAppBrowser() === "tiktok";
}

// App Store Custom Product Page ids. Keyed by BOTH the tutor's slug (/download/<slug>, /qr/<slug>)
// and their username (/redirects/<handle>) — the same tutor is reached either way, and keeping two
// separate maps is what let a tutor resolve on one path but not the other.
//
// Only tutors with a real CPP need entries; everyone else gets the default store URL. A CPP that
// exists in App Store Connect but is missing here silently falls back to the generic page, so add
// the tutor as soon as their page is live. Keep in sync with
// CustomProductPageAttribution.slugToPpid in iOS, which records the referral in-app.
const ADAM_PPID = "a5bb8fc4-a398-442f-b401-92c2cc1e050a";
const MIA_PPID = "86959fbf-bcba-4bea-829f-5b7d73270854";
const HAYDEN_PPID = "42f15230-8e6c-434c-b41f-ff76e5db06d5";

const TUTOR_PPID: Record<string, string> = {
  "english-adam": ADAM_PPID,
  adam: ADAM_PPID,
  "korean-mia": MIA_PPID,
  mia: MIA_PPID,
  "korean-hayden": HAYDEN_PPID,
  hayden: HAYDEN_PPID,
};

// This tutor's own App Store page when they have a CPP, else the default store URL.
// Accepts either a tutor slug ("korean-hayden") or a username ("hayden").
export function appStoreUrlForTutor(handle: string | null | undefined): string {
  const ppid = handle ? TUTOR_PPID[handle.toLowerCase()] : undefined;
  return ppid ? `${APP_STORE_URL}?ppid=${ppid}` : APP_STORE_URL;
}
