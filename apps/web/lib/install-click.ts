import type { NextRequest } from "next/server";

import { API_BASE_URL } from "./api";

/**
 * Where the tap happened. First-hop sources (`profile`, `lesson_share`) are the surface that
 * actually drove the install; the rest are store hops at the end of the same journey. The
 * backend folds repeat hops for one tutor+IP into a single row, keeping the first-hop source.
 */
export type InstallClickSource =
  | "download" | "qr" | "redirects" | "vanity" | "profile" | "lesson_share";

// Only log in production: previews and local runs have no secret and would log on every request.
function warn(message: string, detail: Record<string, unknown>): void {
  if (process.env.VERCEL_ENV !== "production") return;
  console.warn(`[install-click] ${message}`, detail);
}

// Fire-and-forget click snapshot for deferred install attribution — wrap the call in
// event.waitUntil so it never delays the redirect. Apple hands a freshly-installed app
// nothing about the product page it came from, so the only way to connect install →
// tutor is to record the tap's network + device fingerprint here and let the app match
// it on first launch (POST /public/install-clicks/match).
export async function reportInstallClick(
  request: NextRequest,
  click: { handle: string; source: InstallClickSource; lessonId?: string | null },
): Promise<void> {
  const secret = process.env.CLICK_REPORT_SECRET;
  // No secret configured (local/preview) → skip; the endpoint would 401 anyway. In production
  // this means attribution is silently off, which is worth a log — nothing else would show it.
  if (!secret) {
    warn("CLICK_REPORT_SECRET unset — click dropped", { source: click.source });
    return;
  }
  if (!click.handle) return;

  // Leftmost hop is the client; Vercel appends its own proxies to the right.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) {
    warn("no client IP — click dropped", { handle: click.handle, source: click.source });
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/public/install-clicks`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-click-report-secret": secret },
      body: JSON.stringify({
        handle: click.handle,
        source: click.source,
        ip,
        ua: request.headers.get("user-agent") ?? "",
        locale: request.headers.get("accept-language")?.split(",")[0] ?? null,
        geo_timezone: request.headers.get("x-vercel-ip-timezone") ?? null,
        lesson_id: click.lessonId ?? null,
      }),
      signal: AbortSignal.timeout(3000),
    });

    // A 401 (rotated secret), 422 (source the backend doesn't know yet) or 404 (endpoint not
    // promoted) all drop the click while still looking like a healthy redirect from out here.
    if (!res.ok) {
      warn("report rejected", { status: res.status, handle: click.handle, source: click.source });
      return;
    }
    const body = await res.json().catch(() => null);
    if (body && body.recorded === false) {
      warn("not recorded — unknown handle, disabled tutor, or flood guard", {
        handle: click.handle,
        source: click.source,
      });
    }
  } catch (err) {
    // Attribution must never break a redirect.
    warn("report failed", { handle: click.handle, source: click.source, err: String(err) });
  }
}
