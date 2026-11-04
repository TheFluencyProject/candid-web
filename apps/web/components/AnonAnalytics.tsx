import { headers } from "next/headers";

import { PostHogProvider } from "@/components/PostHogProvider";
import { pickLocale } from "@/lib/i18n-helpers";
import { DESKTOP_CTA_FLAG_KEY } from "@/lib/posthog-config";
import { getDesktopCtaVariant, getDistinctId } from "@/lib/posthog-server";

// Pageview tracking for the top-level routes that sit OUTSIDE /[locale] and so never saw the
// provider mounted in its layout: lesson share links, /videos, /g, /desktop.
//
// Bare wiring by default — mobile-cta-copy is a marketing-homepage concern. Lesson routes pass
// desktopCta to bootstrap desktop-cta-qr (en only, like the [locale] layout); the lesson page reads
// the same cached evaluation for the variant it renders. distinct_id is the same candid_did the
// middleware stamps for these routes (ANON_ANALYTICS_ROUTES — they need their own matcher entries
// to get it), so a visitor who lands on a share link and then walks into the marketing site stays
// one person. The fallback below is a safety net: posthog register()s whatever it gets, so a fresh
// UUID per render would mint a new person on every load.
export default async function AnonAnalytics({ children, desktopCta = false }: { children: React.ReactNode; desktopCta?: boolean }) {
  const distinctId = await getDistinctId();
  const locale = desktopCta ? pickLocale((await headers()).get("accept-language")) : null;
  const bootstrapFlags: Record<string, string | boolean> =
    locale === "en" ? { [DESKTOP_CTA_FLAG_KEY]: await getDesktopCtaVariant(distinctId) } : {};

  return (
    <PostHogProvider distinctId={distinctId} bootstrapFlags={bootstrapFlags}>
      {children}
    </PostHogProvider>
  );
}
