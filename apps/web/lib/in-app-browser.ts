// In-app webviews that refuse to hand a store link off to the App Store. Navigating one to
// apps.apple.com just loads the web page inside the webview, and the itms-apps:// redirect that
// page issues is then dropped — the user dead-ends. A server redirect can never fix this; the
// only way out is to bounce the URL to the system browser first. See escapeToNativeBrowser.

export type InAppBrowserFamily = "instagram" | "threads" | "messenger" | "facebook" | "tiktok";

// Order matters. Threads ("Barcelona") and Messenger both also carry the generic Facebook
// tokens, so the specific tests have to run before the FBAN/FBAV catch-all.
const FAMILY_PATTERNS: ReadonlyArray<readonly [InAppBrowserFamily, RegExp]> = [
  ["threads", /Barcelona/i],
  ["instagram", /Instagram/i],
  ["messenger", /Messenger|MessengerForiOS|MessengerLiteFor/i],
  ["facebook", /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i],
  ["tiktok", /TikTok|BytedanceWebview|musical_ly|\btrill\b|Bytedance/i],
];

function agent(ua?: string): string {
  if (typeof ua === "string") return ua;
  return typeof navigator === "undefined" ? "" : navigator.userAgent || "";
}

export function detectInAppBrowser(ua?: string): InAppBrowserFamily | null {
  const s = agent(ua);
  return FAMILY_PATTERNS.find(([, re]) => re.test(s))?.[0] ?? null;
}

export function isInAppBrowser(ua?: string): boolean {
  return detectInAppBrowser(ua) !== null;
}

// Wider than platform.ts's isIOSUserAgent: iPadOS 13+ reports a desktop "Macintosh" UA and the
// touch-point count is the only tell. That half needs `navigator`, so it only fires client-side.
export function isIOS(ua?: string): boolean {
  const s = agent(ua);
  if (/iPad|iPhone|iPod/.test(s)) return true;
  return /Macintosh/.test(s) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;
}

export function isAndroid(ua?: string): boolean {
  return /Android/.test(agent(ua));
}

// Bounce `url` out of the in-app webview into the system browser, so the store link opens somewhere
// that can actually hand off to the App Store. Returns false when no escape applies to this context
// (desktop, a real browser, or iOS TikTok) — callers should navigate normally in that case.
//
// The iOS Instagram scheme is undocumented and Meta can withdraw it at any time. Callers must not
// assume success: watch for the page going hidden and fall back to manual instructions if it stays.
export function escapeToNativeBrowser(url: string, ua?: string): boolean {
  const family = detectInAppBrowser(ua);
  if (!family) return false;

  if (isIOS(ua)) {
    // TikTok's iOS webview handles neither escape below, so don't claim we got out.
    if (family === "tiktok") return false;
    if (family === "instagram" || family === "threads") {
      // Handled by the Instagram app itself: opens the URL in the system default browser.
      window.location.href = `instagram://extbrowser/?url=${encodeURIComponent(url)}`;
    } else {
      window.open(`x-safari-${url}`, "_blank");
    }
    return true;
  }

  if (isAndroid(ua)) {
    const bare = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    window.location.href = `intent://${bare}#Intent;scheme=https;end`;
    return true;
  }

  return false;
}
