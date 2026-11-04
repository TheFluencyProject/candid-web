// Shared PostHog constants used by both the browser SDK (PostHogProvider)
// and the Node SDK (lib/posthog-server). Kept in one place so server-decide
// and client-bootstrap can't drift.

// Safe to hardcode: phc_ is PostHog's write-only project key, public by design, and it
// already ships in the browser bundle. This repo is PUBLIC (see README) — a key that isn't
// publishable must go in a Vercel env var instead.
// Same projects as the iOS app, so a web visitor and the app user they become are one person:
// production → Candid (prod), previews and local → Candid (dev). The browser bundle only sees
// the NEXT_PUBLIC_ copy Vercel exposes; server code and middleware read VERCEL_ENV.
const VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;
export const POSTHOG_KEY = VERCEL_ENV === "production"
  ? "phc_fR2U6mMjgFq6gVgNoHR1zjv8uKRbsDoLfPI950XhUEp"
  : "phc_bsKXIspHrmUckFKKtZ629wuctSQGB427oBAZq0lmeWJ";
// Ingestion + flags. Used directly by the Node SDK, and as the middleware proxy's upstream.
export const POSTHOG_HOST = "https://us.i.posthog.com";
// CDN for the lazily-loaded bundles (recorder, surveys, remote config).
export const POSTHOG_ASSETS_HOST = "https://us-assets.i.posthog.com";
// First-party path the browser SDK talks to — ad blockers block *.posthog.com by domain, so
// the client never names it. Middleware rewrites this to the two hosts above.
// Deliberately meaningless: "ingest"/"track"/"analytics" are themselves blocklisted.
export const POSTHOG_PROXY_PATH = "/lx";
// Toolbar/app deep links, which can no longer be inferred from api_host once it's relative.
export const POSTHOG_UI_HOST = "https://us.posthog.com";
export const CTA_FLAG_KEY = "mobile-cta-copy";

export type MobileCtaVariant = "control" | "download_app";

// Desktop hero CTA on tutor + lesson pages: plan desktop-cta-qr-ab-test-2026-11-01.
export const DESKTOP_CTA_FLAG_KEY = "desktop-cta-qr";

export type DesktopCtaVariant = "control" | "morph" | "inline";
