import Image from "next/image";
import { cookies } from "next/headers";
import SiteFooter from "@/components/SiteFooter";
import MobileCTABar from "@/components/MobileCTABar";
import ScreenshotMarquee from "@/components/ScreenshotMarquee";
import { type Tutor, fetchTutor } from "@/lib/api";
import { getMobileCtaVariant } from "@/lib/posthog-server";
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

// Fisher–Yates. Runs server-side (page is dynamic via cookies), so the order is
// fixed before hydration — no SSR/client mismatch.
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

type Props = { locale: string };

export default async function SimpleLanding({ locale }: Props) {
  // A/B variant only for en; ko renders MobileCTABar's fixed translated copy.
  // React.cache dedupes with the layout's call, so this is free.
  const distinctId = (await cookies()).get("candid_did")?.value ?? crypto.randomUUID();
  const ctaVariant = locale === "en" ? await getMobileCtaVariant(distinctId) : undefined;

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

  return (
    <main className="text-white" style={{ backgroundColor: "#18181C" }}>
      {/* min-h-screen keeps the footer below the fold; the hero + screenshot row are
          centered in the space below the header so empty room is balanced top/bottom. */}
      <section className="flex min-h-screen flex-col">
        {/* Wordmark left; App Store badge top-right on every breakpoint. Padding
            matches the original TutorNavbar (px-4 md:px-8) so it isn't too wide. */}
        <header className="flex items-center justify-between px-4 md:px-8 pt-5">
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
          {/* App Store badge — plain <img> (an SVG needs no next/image optimization
              and avoids its aspect warning under Tailwind's base height:auto). */}
          <a href="/download">
            <img src="/download.svg" alt="Download on the App Store" width={120} className="h-auto" />
          </a>
        </header>

        {/* Center the hero + screenshot row in the space below the header. */}
        <div className="flex flex-1 flex-col justify-center">
          <div className="px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-[1.1] mb-5">
              Not another AI tutor
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed text-gray-300">
              Learn real-life Korean with daily listening &amp; speaking practice
              <br />
              from your favorite tutors
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Primary — learn (→ /download, UA-aware App Store redirect). */}
              <a
                href="/download"
                className="inline-block rounded-full bg-white px-8 py-3.5 text-base font-semibold tracking-wide text-[#18181C] hover:opacity-90 transition-opacity"
              >
                LEARN WITH CANDID
              </a>
              {/* Secondary — teach (become a tutor). Translucent = less prominent. */}
              <a
                href={BECOME_A_TUTOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-white/10 px-8 py-3.5 text-base font-semibold tracking-wide text-white hover:bg-white/20 transition-colors"
              >
                TEACH ON CANDID
              </a>
            </div>
          </div>

          {/* Breathing room between the hero and the screenshot row (less on
              mobile, where vertical space is tight). */}
          <div className="mt-8 md:mt-20">
            <ScreenshotMarquee urls={screenshots} />
          </div>
        </div>
      </section>

      <SiteFooter />
      <MobileCTABar ctaVariant={ctaVariant} />
    </main>
  );
}
