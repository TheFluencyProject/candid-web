import type { NextRequest } from "next/server";

import { API_BASE_URL } from "./api";

// Fire-and-forget click snapshot for deferred install attribution — wrap the call in
// event.waitUntil so it never delays the redirect. Apple hands a freshly-installed app
// nothing about the product page it came from, so the only way to connect install →
// tutor is to record the tap's network + device fingerprint here and let the app match
// it on first launch (POST /public/install-clicks/match).
export async function reportInstallClick(
  request: NextRequest,
  click: { handle: string; source: "download" | "qr" | "redirects"; lessonId?: string | null },
): Promise<void> {
  const secret = process.env.CLICK_REPORT_SECRET;
  // No secret configured (local/preview) → skip silently; the endpoint would 401 anyway.
  if (!secret || !click.handle) return;

  // Leftmost hop is the client; Vercel appends its own proxies to the right.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return;

  try {
    await fetch(`${API_BASE_URL}/public/install-clicks`, {
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
  } catch {
    // Attribution must never break a redirect.
  }
}
