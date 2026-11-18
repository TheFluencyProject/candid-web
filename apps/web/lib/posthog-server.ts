import "server-only";
import { PostHog } from "posthog-node";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  CTA_FLAG_KEY,
  LESSON_HERO_FLAG_KEY,
  QR_CARD_FLAG_KEY,
  LESSON_SECTIONS_FLAG_KEY,
  POSTHOG_HOST,
  POSTHOG_KEY,
  type LessonHeroVariant,
  type LessonSectionsVariant,
  type MobileCtaVariant,
  type QrCardVariant,
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

// desktop-qr-card for the [locale] pages (landing, tutor pages…). Not evaluateFlags: its getFlag() does send a server
// $feature_flag_called (verified against the dev project), for every visitor including mobile — and this test's
// exposure must be DownloadQRInterceptor's, when a desktop QR first shows. getAllFlags reads without capturing.
// (desktop-cta-qr's read is gone 11/18: no page renders its arms any more.)
export const getQrCardVariant = cache(
  async (distinctId: string): Promise<QrCardVariant> => {
    try {
      const flags = await getClient().getAllFlags(distinctId, { flagKeys: [QR_CARD_FLAG_KEY] });
      return flags[QR_CARD_FLAG_KEY] === "card" ? "card" : "control";
    } catch {
      return "control";
    }
  },
);

// ?sections= / ?hero= / ?qr= force an arm on local + Vercel previews so each one can be rendered on demand.
// Never in production: a shared link must not override the visitor's assigned arm.
export function previewArm<T extends string>(param: string | string[] | undefined, arms: readonly T[]): T | null {
  if (process.env.VERCEL_ENV === "production") return null;
  return arms.find((arm) => arm === param) ?? null;
}

// Every lesson-page test in one read-only getAllFlags (same reason as above: the exposures are the client's —
// FlagExposure on the page, and DownloadQRInterceptor when the QR first shows). Cached, so the layout's bootstrap and
// the page share one call.
export const getLessonPageFlags = cache(
  async (distinctId: string): Promise<{ sections: LessonSectionsVariant; hero: LessonHeroVariant; qr: QrCardVariant }> => {
    try {
      const flags = await getClient().getAllFlags(distinctId, {
        flagKeys: [LESSON_SECTIONS_FLAG_KEY, LESSON_HERO_FLAG_KEY, QR_CARD_FLAG_KEY],
      });
      return {
        sections: flags[LESSON_SECTIONS_FLAG_KEY] === "sections" ? "sections" : "control",
        hero: flags[LESSON_HERO_FLAG_KEY] === "path" ? "path" : "control",
        qr: flags[QR_CARD_FLAG_KEY] === "card" ? "card" : "control",
      };
    } catch {
      return { sections: "control", hero: "control", qr: "control" };
    }
  },
);
