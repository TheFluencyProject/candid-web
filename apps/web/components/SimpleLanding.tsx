import Image from "next/image";
import { cookies } from "next/headers";
import SiteFooter from "@/components/SiteFooter";
import MobileCTABar from "@/components/MobileCTABar";
import ScreenshotMarquee from "@/components/ScreenshotMarquee";
import { type Tutor, fetchTutor } from "@/lib/api";
import { getMobileCtaVariant } from "@/lib/posthog-server";

// All web tutors (config/tutors.ts). Each contributes its app screenshots to the row.
const TUTOR_SLUGS = ["korean-mia", "english-adam", "korean-chan"];

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
    <main className="min-h-screen text-white" style={{ backgroundColor: "#18181C" }}>
      {/* Wordmark left; App Store badge top-right on mobile only (desktop badge
          sits under the hero instead). */}
      <header className="flex items-center justify-between px-6 md:px-10 pt-8">
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
        {/* Plain <img>: an SVG badge needs no next/image optimization, and it
            avoids next/image's aspect warning under Tailwind's base height:auto. */}
        <a href="/download" className="lg:hidden">
          <img src="/download.svg" alt="Download on the App Store" width={120} className="h-auto" />
        </a>
      </header>

      {/* Compact hero so the screenshot row sits right below it. */}
      <section className="px-6 pt-16 md:pt-24 pb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-[1.1] mb-5">
          Not another AI tutor
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed text-gray-300">
          Learn real-life Korean with daily listening &amp; speaking practice from your favorite creators
        </p>
        {/* Desktop only: App Store badge under the hero. */}
        <a href="/download" className="hidden lg:inline-block mt-8">
          <img src="/download.svg" alt="Download on the App Store" width={150} className="h-auto" />
        </a>
      </section>

      <ScreenshotMarquee urls={screenshots} />

      <SiteFooter />
      <MobileCTABar ctaVariant={ctaVariant} />
    </main>
  );
}
