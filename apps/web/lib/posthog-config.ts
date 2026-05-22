// Shared PostHog constants used by both the browser SDK (PostHogProvider)
// and the Node SDK (lib/posthog-server). Kept in one place so server-decide
// and client-bootstrap can't drift.

export const POSTHOG_KEY = "phc_z63G96rjoQ69KcCvirgWCd65MTRWu8ihGEs24ugqmiAF";
export const POSTHOG_HOST = "https://us.i.posthog.com";
export const CTA_FLAG_KEY = "mobile-cta-copy";

export type MobileCtaVariant = "control" | "download_app";
