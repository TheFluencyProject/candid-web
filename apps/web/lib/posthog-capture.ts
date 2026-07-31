import { POSTHOG_HOST, POSTHOG_KEY } from "./posthog-config";

// Fire-and-forget capture for middleware — wrap the call in event.waitUntil so it never delays
// the response. posthog-server.ts only does flag evaluation (no capture API), and posthog-node's
// batching client is the wrong shape for a one-shot edge invocation; a plain fetch is the whole
// job. Straight to POSTHOG_HOST: the /lx proxy exists to dodge browser ad blockers, and a
// self-call would re-enter this same middleware.
export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch(`${POSTHOG_HOST}/i/v0/e/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        // The capture API defaults to IDENTIFIED events — the opposite of the browser SDK's
        // identified_only. Without this flag every scan would create a person profile.
        properties: { $process_person_profile: false, ...properties },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Analytics must never break a redirect.
  }
}
