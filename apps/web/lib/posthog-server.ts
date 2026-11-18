import "server-only";
import { PostHog } from "posthog-node";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  CTA_FLAG_KEY,
  DESKTOP_CTA_FLAG_KEY,
  LESSON_HERO_FLAG_KEY,
  LESSON_SECTIONS_FLAG_KEY,
  POSTHOG_HOST,
  POSTHOG_KEY,
  type DesktopCtaVariant,
  type LessonHeroVariant,
  type LessonSectionsVariant,
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

// One per request, shared by layout + page: the fallback UUID (cookie not stamped yet) must be the
// same value the layout bootstraps and the page bakes into the QR's sid.
export const getDistinctId = cache(async (): Promise<string> => {
  const cookieStore = await cookies();
  return cookieStore.get("candid_did")?.value ?? crypto.randomUUID();
});

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

// Not evaluateFlags: its getFlag() does send a server $feature_flag_called (verified against the dev
// project), for every visitor including mobile — and this experiment's exposure must be DesktopCTA's
// client-side, desktop-only one. getAllFlags reads the value without capturing anything.
export const getDesktopCtaVariant = cache(
  async (distinctId: string): Promise<DesktopCtaVariant> => {
    try {
      const flags = await getClient().getAllFlags(distinctId, { flagKeys: [DESKTOP_CTA_FLAG_KEY] });
      const v = flags[DESKTOP_CTA_FLAG_KEY];
      return v === "morph" || v === "inline" ? v : "control";
    } catch {
      return "control";
    }
  },
);

// ?cta= / ?sections= / ?hero= force an arm on local + Vercel previews so each one can be rendered on demand.
// Never in production: a shared link must not override the visitor's assigned arm.
export function previewArm<T extends string>(param: string | string[] | undefined, arms: readonly T[]): T | null {
  if (process.env.VERCEL_ENV === "production") return null;
  return arms.find((arm) => arm === param) ?? null;
}

// Both lesson-page tests in one read-only getAllFlags (same reason as above: the exposures are the client's
// FlagExposure on the lesson page). Cached, so the layout's bootstrap and the page share one call.
export const getLessonPageFlags = cache(
  async (distinctId: string): Promise<{ sections: LessonSectionsVariant; hero: LessonHeroVariant }> => {
    try {
      const flags = await getClient().getAllFlags(distinctId, { flagKeys: [LESSON_SECTIONS_FLAG_KEY, LESSON_HERO_FLAG_KEY] });
      return {
        sections: flags[LESSON_SECTIONS_FLAG_KEY] === "sections" ? "sections" : "control",
        hero: flags[LESSON_HERO_FLAG_KEY] === "path" ? "path" : "control",
      };
    } catch {
      return { sections: "control", hero: "control" };
    }
  },
);
