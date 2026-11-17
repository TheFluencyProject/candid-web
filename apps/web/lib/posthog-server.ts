import "server-only";
import { PostHog } from "posthog-node";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  CTA_FLAG_KEY,
  DESKTOP_CTA_FLAG_KEY,
  LESSON_SECTIONS_FLAG_KEY,
  POSTHOG_HOST,
  POSTHOG_KEY,
  type DesktopCtaVariant,
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

// ?cta=control|morph|inline forces an arm on local + Vercel previews so each one can be rendered
// on demand. Never in production: a shared link must not override the visitor's assigned arm.
export function previewDesktopCtaOverride(param: string | string[] | undefined): DesktopCtaVariant | null {
  if (process.env.VERCEL_ENV === "production") return null;
  return param === "control" || param === "morph" || param === "inline" ? param : null;
}

// Same read-only getAllFlags as above: the exposure is the client's (FlagExposure on the lesson page).
export const getLessonSectionsVariant = cache(
  async (distinctId: string): Promise<LessonSectionsVariant> => {
    try {
      const flags = await getClient().getAllFlags(distinctId, { flagKeys: [LESSON_SECTIONS_FLAG_KEY] });
      return flags[LESSON_SECTIONS_FLAG_KEY] === "sections" ? "sections" : "control";
    } catch {
      return "control";
    }
  },
);

// ?sections=control|sections, local + previews only — same rule as ?cta= above.
export function previewLessonSectionsOverride(param: string | string[] | undefined): LessonSectionsVariant | null {
  if (process.env.VERCEL_ENV === "production") return null;
  return param === "control" || param === "sections" ? param : null;
}
