import "server-only";
import { PostHog } from "posthog-node";
import { cache } from "react";
import {
  CTA_FLAG_KEY,
  POSTHOG_HOST,
  POSTHOG_KEY,
  type MobileCtaVariant,
} from "./posthog-config";

// Module-scope client so the flag-definition cache and poller live across requests.
let client: PostHog | null = null;
function getClient(): PostHog {
  if (!client) {
    client = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });
  }
  return client;
}

// React.cache dedupes per-request: layout + page can both call this and we hit PostHog at most once.
// evaluateFlags doesn't auto-fire $feature_flag_called on the server — the client SDK
// emits the single exposure after bootstrap (see MobileCTABar).
export const getMobileCtaVariant = cache(
  async (distinctId: string): Promise<MobileCtaVariant> => {
    try {
      const flags = await getClient().evaluateFlags(distinctId);
      const v = flags.getFlag(CTA_FLAG_KEY);
      return v === "download_app" ? "download_app" : "control";
    } catch {
      return "control";
    }
  },
);
