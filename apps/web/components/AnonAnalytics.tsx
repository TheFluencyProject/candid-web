import { PostHogProvider } from "@/components/PostHogProvider";
import { LESSON_HERO_FLAG_KEY, LESSON_SECTIONS_FLAG_KEY, QR_CARD_FLAG_KEY } from "@/lib/posthog-config";
import { getDistinctId, getLessonPageFlags } from "@/lib/posthog-server";

// Pageview tracking for the top-level routes that sit OUTSIDE /[locale] and so never saw the
// provider mounted in its layout: lesson share links, /videos, /g, /desktop.
//
// Bare wiring by default — mobile-cta-copy is a marketing-homepage concern. lessonPage bootstraps
// lesson-page-sections, lesson-page-hero and desktop-qr-card (every locale); the lesson page reads the same
// cached evaluation for the arms it renders. distinct_id is the same candid_did the
// middleware stamps for these routes (ANON_ANALYTICS_ROUTES — they need their own matcher entries
// to get it), so a visitor who lands on a share link and then walks into the marketing site stays
// one person. The fallback below is a safety net: posthog register()s whatever it gets, so a fresh
// UUID per render would mint a new person on every load.
export default async function AnonAnalytics({ children, lessonPage = false }: { children: React.ReactNode; lessonPage?: boolean }) {
  const distinctId = await getDistinctId();
  const lessonFlags = lessonPage ? await getLessonPageFlags(distinctId) : null;
  const bootstrapFlags: Record<string, string | boolean> = {
    ...(lessonFlags
      ? { [LESSON_SECTIONS_FLAG_KEY]: lessonFlags.sections, [LESSON_HERO_FLAG_KEY]: lessonFlags.hero, [QR_CARD_FLAG_KEY]: lessonFlags.qr }
      : {}),
  };

  return (
    <PostHogProvider distinctId={distinctId} bootstrapFlags={bootstrapFlags}>
      {children}
    </PostHogProvider>
  );
}
