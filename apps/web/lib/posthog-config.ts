// Shared PostHog constants used by both the browser SDK (PostHogProvider)
// and the Node SDK (lib/posthog-server). Kept in one place so server-decide
// and client-bootstrap can't drift.

export const POSTHOG_KEY = "phc_z63G96rjoQ69KcCvirgWCd65MTRWu8ihGEs24ugqmiAF";
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
