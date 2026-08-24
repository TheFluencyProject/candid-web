import { detectInAppBrowser } from "./in-app-browser";

export const APP_STORE_URL = "https://apps.apple.com/app/id6754859158";
// macOS DMG "latest" alias — the fastlane mac_release lane overwrites this key each release.
export const MAC_DOWNLOAD_URL =
  "https://tfp-app-downloads.s3.us-west-1.amazonaws.com/mac/Candid.dmg";
// Candid's Apple-provided ("basic") App Clip link — surfaces the clip card on iOS.
export const APP_CLIP_URL = "https://appclip.apple.com/id?p=co.thefluencyproject.bloom-ios.Clip";
export const WAITLIST_URL =
  "https://thefluencyproject.notion.site/359bc1de5e3480bdbecddd96d7f73a3e?pvs=105";

// Flip to true to send non-iOS users to the waitlist instead of the App Store.
export const WAITLIST_ENABLED = false;

export function isIOSUserAgent(ua: string): boolean {
  return /iPhone|iPad|iPod/i.test(ua);
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

export function getRedirectUrl(
  ua: string,
  appStoreUrl = APP_STORE_URL,
): string {
  if (!WAITLIST_ENABLED || isIOSUserAgent(ua)) return appStoreUrl;
  return WAITLIST_URL;
}
