import { cookies } from "next/headers";

import { PostHogProvider } from "@/components/PostHogProvider";

// Pageview tracking for the top-level routes that sit OUTSIDE /[locale] and so never saw the
// provider mounted in its layout: lesson share links, /videos, /g, /desktop.
//
// Bare wiring on purpose — no bootstrapped flags, since the one experiment we bootstrap
// (mobile-cta-copy) is a marketing-homepage concern. distinct_id is the same candid_did the
// middleware stamps for these routes (ANON_ANALYTICS_ROUTES — they need their own matcher entries
// to get it), so a visitor who lands on a share link and then walks into the marketing site stays
// one person. The fallback below is a safety net: posthog register()s whatever it gets, so a fresh
// UUID per render would mint a new person on every load.
export default async function AnonAnalytics({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const distinctId = cookieStore.get("candid_did")?.value ?? crypto.randomUUID();

  return (
    <PostHogProvider distinctId={distinctId} bootstrapFlags={{}}>
      {children}
    </PostHogProvider>
  );
}
