import type { AndroidWaitlistSurface } from "@/lib/api";
import type { DesktopCtaVariant } from "@/lib/posthog-config";

const BASE_URL = "https://joincandid.co";

// The desktop QR encodes /qr/<slug>, NOT the /download link itself — /download is a registered App
// Clip Experience, so scanning it pops the clip card before the redirect can run. /qr is
// unregistered (goes straight to the tutor's App Store page) and lets middleware record the scan.
// The App Clip funnel used `${BASE_URL}${href}` here; restore that if it's ever re-enabled.
export function buildQrUrl({ tutor_slug, surface, sid, lesson_id, variant }: {
  tutor_slug: string;
  surface: AndroidWaitlistSurface;
  sid?: string | null;
  lesson_id?: string | null;
  variant?: DesktopCtaVariant | null;
}): string {
  const params = new URLSearchParams({ s: surface });
  // Omit rather than bake "undefined" into the QR (the client SDK's id is unset before init).
  if (sid) params.set("sid", sid);
  if (lesson_id) params.set("l", lesson_id);
  // Middleware copies this onto qr_scanned as cta_variant.
  if (variant) params.set("v", variant);
  // No trailing slash on the bare form — Next 308s "/qr/" to "/qr" before middleware runs.
  const path = tutor_slug ? `/qr/${tutor_slug}` : "/qr";
  return `${BASE_URL}${path}?${params}`;
}
