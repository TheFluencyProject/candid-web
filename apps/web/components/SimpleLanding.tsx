import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";
import ScreenshotMarquee from "@/components/ScreenshotMarquee";
import MarketingClipMarquee from "@/components/MarketingClipMarquee";
import { type Tutor, type MarketingClip, fetchTutor, fetchMarketingClips } from "@/lib/api";
import { BECOME_A_TUTOR_URL } from "@/lib/platform";

// Active/featured tutors. The public tutor API exposes no active flag, so the
// set is listed here (matches the old home); korean-chan has a profile page but
// is inactive, so it's excluded. Each tutor contributes its app screenshots.
const TUTOR_SLUGS = ["korean-mia", "english-adam"];

const SCREENSHOT_KEYS = [
  "screenshot_listen_url",
  "screenshot_week_url",
  "screenshot_shadow_url",
  "screenshot_map_url",
  "screenshot_community_url",
  "screenshot_intro_url",
  "screenshot_learn_url",
] as const;

// Fisher–Yates. Runs server-side (the route is dynamic — page.tsx reads
// headers()), so the order is fixed before hydration — no SSR/client mismatch.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Round-robin across tutors so adjacent screenshots are different tutors
// ("alternating randomly" — same alternation idea as the old home's i % len).
function interleave(lists: string[][]): string[] {
  const out: string[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}

type Props = { locale: string; karaoke?: boolean };

export default async function SimpleLanding({ locale, karaoke = true }: Props) {
  // Promise.all + filter(null): a 404 drops out; a transient throw → Next serves
  // the last cached render (see fetchTutor) instead of a blank row.
  const tutors = (
    await Promise.all(TUTOR_SLUGS.map((slug) => fetchTutor(slug, locale)))
  ).filter((t): t is Tutor => t !== null);

  const screenshots = interleave(
    tutors.map((t) =>
      shuffle(SCREENSHOT_KEYS.map((k) => t[k]).filter((u): u is string => !!u))
    )
  );

  // Live hero clips. A throw (backend hiccup, or the endpoint not deployed yet)
  // falls back to the static screenshot marquee below — the hero is never blank.
  let clips: MarketingClip[] = [];
  try {
    // Home markets Korean — show only Korean creators' clips, not English tutors'.
    clips = shuffle(await fetchMarketingClips(locale, { language: "korean" }));
  } catch {
    clips = [];
  }

  return (
    <main className="text-white" style={{ backgroundColor: "#18181C" }}>
      {/* Desktop: min-h-screen + centered hero/row keeps the footer below the fold.
          Mobile: natural top-down flow (no forced viewport height) so the spacing
          isn't stretched to fill the screen. */}
      <section className="flex flex-col md:min-h-screen">
        {/* Wordmark only; the App Store badge now lives in the footer. Padding
            matches the original TutorNavbar (px-4 md:px-8) so it isn't too wide. */}
        <header className="flex items-center px-4 md:px-8 pt-5">
          <a href="/" className="inline-block">
            <Image
              src="/wordmark-white.svg"
              alt="Candid"
              width={80}
              height={21}
              priority
              className="hover:opacity-80 transition-opacity"
            />
          </a>
        </header>

        {/* Desktop centers the hero in the min-h-screen viewport; mobile flows naturally
            from the top (md:justify-center only) with real breathing room above the title. */}
        <div className="flex flex-1 flex-col md:justify-center">
          <div className="px-6 text-center pt-12 md:pt-0">
            <h1 className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.1] mb-5">
              Less scrolling.<br />More speaking.
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-xl leading-relaxed text-gray-300">
              Learn real-life Korean with daily listening &amp; speaking practice{" "}
              <br className="hidden md:inline" />
              from your favorite creators.
            </p>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
              {/* Primary — learn (→ /download, UA-aware App Store redirect). */}
              <a
                href="/download"
                className="inline-block rounded-full bg-[#89FFB4] px-8 py-2.5 md:py-3 text-base font-semibold tracking-wide text-[#18181C] hover:opacity-90 transition-opacity"
              >
                LEARN WITH CANDID
              </a>
              {/* Secondary — teach (become a tutor). Translucent = less prominent. */}
              <a
                href={BECOME_A_TUTOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-white/10 px-8 py-2.5 md:py-3 text-base font-semibold tracking-wide text-white hover:bg-white/20 transition-colors"
              >
                TEACH ON CANDID
              </a>
            </div>
          </div>

          {/* Normal gap above the row — matches the rest of the hero spacing. On mobile,
              mb-8 below ≈ the pt-12 above the title (the marquee's own py-4 adds ~16px). */}
          <div className="mt-6 md:mt-8 mb-8 md:mb-0">
            {clips.length > 0 ? (
              <MarketingClipMarquee clips={clips} karaoke={karaoke} />
            ) : (
              <ScreenshotMarquee urls={screenshots} />
            )}
          </div>
        </div>
      </section>

      <SiteFooter appStoreBadge />
    </main>
  );
}
