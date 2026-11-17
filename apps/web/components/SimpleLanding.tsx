import { getTranslations } from "next-intl/server";
// import { Link } from "@/i18n/routing"; // only used by the hidden teach CTA below
import SiteFooter from "@/components/SiteFooter";
import ScreenshotMarquee from "@/components/ScreenshotMarquee";
import PhoneClipHero from "@/components/PhoneClipHero";
import { lobster } from "@/lib/lobster";
import LandingSections, { loadLandingClips, shuffle } from "@/components/LandingSections";
import ScrollNav from "@/components/ScrollNav";
import { type Tutor, fetchTutor } from "@/lib/api";

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

// Round-robin across tutors so adjacent items are different tutors
// ("alternating randomly" — same alternation idea as the old home's i % len).
function interleave<T>(lists: T[][]): T[] {
  const out: T[] = [];
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
  const t = await getTranslations("home");
  // tracking-wide was tuned for the uppercase Latin labels; it just looks loose on Hangul.
  const tracking = locale === "ko" ? "" : "tracking-wide";

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

  // Live hero clips, shared with the sections below. None (a throw, or nothing starred) falls back
  // to the static screenshot marquee — the hero is never blank.
  const clips = await loadLandingClips(locale);

  return (
    <main className="text-white" style={{ backgroundColor: "#18181C" }}>
      <ScrollNav ctaLabel={t("cta_learn")} tracking={tracking} />
      {/* pt-[61px]: clears the fixed top bar, which now shows from the start and carries the wordmark. */}
      <section className="flex flex-col pt-[61px]">
        {/* One screen under the top bar (Adam 11/17): copy on the left, one phone on the right playing the
            starred clips one at a time (the tutor-page PhoneClipHero). Phones: copy, then the phone under it. */}
        <div className="mx-auto grid w-full max-w-[1080px] min-[860px]:min-h-[calc(100svh-61px)] grid-cols-1 items-center justify-items-center gap-9 px-6 pt-12 pb-16 text-center min-[860px]:grid-cols-[1fr_auto] min-[860px]:justify-items-stretch min-[860px]:gap-14 min-[860px]:pt-6 min-[860px]:pb-10 min-[860px]:text-left">
          <div>
            {/* "Learn real-life Korean" with the script word in Lobster, like the closing line (Adam 11/17). */}
            <h1 className="text-4xl min-[860px]:text-[clamp(40px,5.4vw,64px)] font-normal tracking-[-0.03em] leading-[1.05] [word-break:keep-all] [text-wrap:balance]">
              {t.rich("hero_title", { cool: (chunks) => <span className={`pe-cool !font-normal ${lobster.className}`}>{chunks}</span> })}
            </h1>
            <p className="mt-5 max-w-[30em] mx-auto min-[860px]:mx-0 text-base min-[860px]:text-[19px] leading-normal text-gray-300 [word-break:keep-all] [text-wrap:balance]">
              {t("hero_subtitle")}
            </p>
            <div className="mt-6 min-[860px]:mt-[30px]">
              {/* App Store download. App Clip funnel is disabled for now — this points at the
                  /download App Store redirect, not the App Clip link.
                  Plain <a>, not next-intl Link: /download is a middleware redirect that only
                  matches unprefixed, so a /ko/download href would 404. */}
              <a
                id="hero-cta"
                href="/download"
                className={`inline-block rounded-full bg-[#89FFB4] px-8 py-2.5 md:py-3 text-base font-semibold ${tracking} text-[#18181C] hover:opacity-90 cta-3d`}
              >
                {t("cta_learn")}
              </a>
              {/* Secondary — teach (become a creator). Hidden for now; /teach and the
                  cta_teach strings still exist, so this is a one-line restore:
                  <Link href="/teach" className={`inline-block rounded-full bg-white/10 px-8 py-2.5 md:py-3 text-base font-semibold ${tracking} text-white hover:bg-white/20 transition-colors`}>{t("cta_teach")}</Link> */}
            </div>
          </div>

          {clips.length > 0 ? (
            <div className="w-[min(300px,78vw)] min-[860px]:w-[340px]">
              <PhoneClipHero clips={clips} alt={`${t.raw("hero_title").replace(/<\/?cool>/g, "")} ${t("hero_subtitle")}`} />
            </div>
          ) : (
            <div className="w-full min-[860px]:w-[420px] overflow-hidden">
              <ScreenshotMarquee urls={screenshots} />
            </div>
          )}
        </div>
      </section>

      <LandingSections locale={locale} clips={clips} />

      <SiteFooter appStoreBadge />
    </main>
  );
}
