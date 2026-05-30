/**
 * Host classification shared by middleware (routing) and the guide page
 * (Join-for-free CTA swap).
 *
 * Three host groups:
 *  - JoinCandid canonical (joincandid.co, www.joincandid.co)
 *      → keep the existing "Get the app" CTA
 *  - Candidtutors canonical (candidtutors.co, www.candidtutors.co)
 *      → tutor-community brand; show "Join for free"
 *  - Anything else → resolves to a tutor's custom_domain or 404s
 *      → custom_domain pages also show "Join for free"
 *
 * Preview + local hosts behave like JoinCandid (keep Get the app) so dev
 * doesn't accidentally fire the web-signup flow against test data.
 */

export const JOINCANDID_HOSTS = new Set([
  "joincandid.co",
  "www.joincandid.co",
]);

export const CANDIDTUTORS_HOSTS = new Set([
  "candidtutors.co",
  "www.candidtutors.co",
]);

// Both apexes serve the same site; middleware passes them through to the intl pipeline.
export const CANONICAL_HOSTS = new Set([
  ...JOINCANDID_HOSTS,
  ...CANDIDTUTORS_HOSTS,
]);

function isPreviewOrLocal(host: string): boolean {
  if (host.endsWith(".vercel.app")) return true;
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return true;
  return false;
}

export function isCanonicalHost(host: string): boolean {
  if (CANONICAL_HOSTS.has(host)) return true;
  if (isPreviewOrLocal(host)) return true;
  return false;
}

function normalize(host: string): string {
  return host.toLowerCase().split(":")[0];
}

/**
 * True when the host is the candidtutors.co tutor-discovery brand (apex or www).
 * On these surfaces, "Get the app" is reworded to "Find your tutor" + a
 * "Become a Candid Tutor" secondary pill appears next to it.
 */
export function isCandidtutorsHost(host: string): boolean {
  return CANDIDTUTORS_HOSTS.has(normalize(host));
}

/**
 * True when the current host is a per-tutor custom_domain where the page
 * should render the "Join for free" bottom-sheet flow.
 *
 * - per-tutor custom_domain (e.g. withmia.com) → true
 * - candidtutors.co (and www) → false (Find-your-tutor brand, not a single-tutor surface)
 * - joincandid.co + preview + localhost → false
 */
export function isJoinForFreeContext(host: string): boolean {
  const normalized = normalize(host);
  if (JOINCANDID_HOSTS.has(normalized)) return false;
  if (CANDIDTUTORS_HOSTS.has(normalized)) return false;
  if (isPreviewOrLocal(normalized)) return false;
  return true;
}
