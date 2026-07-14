export const APP_STORE_URL = "https://apps.apple.com/app/id6754859158";
// macOS DMG "latest" alias — the fastlane mac_release lane overwrites this key each release.
export const MAC_DOWNLOAD_URL =
  "https://tfp-app-downloads.s3.us-west-1.amazonaws.com/mac/Candid.dmg";
// Candid's Apple-provided ("basic") App Clip link — surfaces the clip card on iOS.
export const APP_CLIP_URL = "https://appclip.apple.com/id?p=co.thefluencyproject.bloom-ios.Clip";
export const WAITLIST_URL =
  "https://thefluencyproject.notion.site/359bc1de5e3480bdbecddd96d7f73a3e?pvs=105";
export const BECOME_A_TUTOR_URL = "https://thefluencyproject.notion.site/candid-tutor";

// Flip to true to send non-iOS users to the waitlist instead of the App Store.
export const WAITLIST_ENABLED = false;

export function isIOSUserAgent(ua: string): boolean {
  return /iPhone|iPad|iPod/i.test(ua);
}

// These in-app browsers block navigation to apps.apple.com links.
export function isRestrictedInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /TikTok|BytedanceWebview|musical_ly/i.test(navigator.userAgent);
}

export function getRedirectUrl(
  ua: string,
  appStoreUrl = APP_STORE_URL,
): string {
  if (!WAITLIST_ENABLED || isIOSUserAgent(ua)) return appStoreUrl;
  return WAITLIST_URL;
}
