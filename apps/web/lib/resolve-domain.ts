import { API_BASE_URL } from "./api";

/**
 * Resolves a host header (e.g. "englishadam.com") to the tutor slug whose
 * `custom_domain` matches. Returns null for unassigned hosts.
 *
 * Called from candid-web middleware on every non-canonical request.
 * Cached via Next's fetch revalidate so repeat hits don't hit the API.
 */
export async function resolve_tutor_by_host(host: string): Promise<string | null> {
  if (!host) return null;
  // Lowercase + strip port: host headers vary by proxy.
  const normalized = host.toLowerCase().split(":")[0];

  let res: Response;
  try {
    res = await fetch(
      `${API_BASE_URL}/public/domains/${encodeURIComponent(normalized)}`,
      // 5s cap so a slow API can't hold middleware hostage; 5min revalidate
      // mirrors fetchTutor and is the upper bound on stale domain mappings.
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) },
    );
  } catch {
    return null;
  }

  if (res.status === 404) return null;
  if (!res.ok) return null;
  const body = (await res.json()) as { slug?: string };
  return body.slug ?? null;
}

/**
 * Resolves a vanity username (e.g. "hansoo") to the tutor slug, for the
 * joincandid.co/{username} → /tutor/{slug} redirect. Returns null when unknown.
 *
 * Called from middleware for single-segment paths that aren't a known route.
 * Same swallow-errors + 5s cap + 5min revalidate contract as resolve_tutor_by_host.
 */
export async function resolve_tutor_by_username(username: string): Promise<string | null> {
  if (!username) return null;
  const normalized = username.toLowerCase();

  let res: Response;
  try {
    res = await fetch(
      `${API_BASE_URL}/public/usernames/${encodeURIComponent(normalized)}`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) },
    );
  } catch {
    return null;
  }

  if (res.status === 404) return null;
  if (!res.ok) return null;
  const body = (await res.json()) as { slug?: string };
  return body.slug ?? null;
}
