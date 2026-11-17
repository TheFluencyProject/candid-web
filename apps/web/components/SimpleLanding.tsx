import { getTranslations } from "next-intl/server";
// import { Link } from "@/i18n/routing"; // only used by the hidden teach CTA below
import SiteFooter from "@/components/SiteFooter";
import ScreenshotMarquee from "@/components/ScreenshotMarquee";
import PhoneClipHero from "@/components/PhoneClipHero";
import { lobster } from "@/lib/lobster";
import TutorRoster from "@/components/TutorRoster";
import LessonLadder from "@/components/LessonLadder";
import LessonPath, { type PathLesson } from "@/components/LessonPath";
import GardenGrow from "@/components/GardenGrow";
import PageEnding from "@/components/PageEnding";
import ReviewCards from "@/components/ReviewCards";
import ScrollNav from "@/components/ScrollNav";
import { type Tutor, type MarketingClip, fetchTutor, fetchMarketingClips, fetchLessonMeta } from "@/lib/api";

// Active/featured tutors. The public tutor API exposes no active flag, so the
// set is listed here (matches the old home); korean-chan has a profile page but
// is inactive, so it's excluded. Each tutor contributes its app screenshots.
const TUTOR_SLUGS = ["korean-mia", "english-adam"];

// The Korean creators in the people row under the hero (and the lessons ladder's avatars), in the
// mockup's order. korean-jinnny is the real slug (three n's).
const KOREAN_TUTOR_SLUGS = [
  "korean-mia",
  "korean-hansoo",
  "korean-grace",
  "korean-sol",
  "korean-hayden",
  "korean-jinnny",
  "korean-ellie",
  "korean-tina",
  "korean-didi",
];

// The path section's three real lessons (Didi, Mia, Hayden), each in its own accent with one of its own
// stickers beside its indent coin (public/landing/path-<id>-{locked,accent}.webp, w × h).
const PATH_LESSONS: { lesson_id: string; accent: string; sticker: PathLesson["sticker"] }[] = [
  { lesson_id: "f06bb7cb-b337-4fcf-8ddb-f30df8279237", accent: "#3ADAFF", sticker: { id: "053", w: 220, h: 280 } }, // Didi's late-night show, the mic
  { lesson_id: "51c0eff3-4a92-4b07-8e41-a859b36dd44a", accent: "#F6B8BB", sticker: { id: "025", w: 167, h: 280 } }, // Mia's music box collection
  { lesson_id: "87641d82-ac46-48e5-8de1-1ed0b3e6edac", accent: "#C8C5F0", sticker: { id: "033", w: 280, h: 243 } }, // Hayden's home tour
];

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

// Spread each tutor's items evenly across the whole row: item i of a tutor with n items
// sits at (i + offset) / n, with a random per-tutor offset. Round-robin instead bunches a
// heavy tutor's extras at the tail (e.g. 6 Mia vs 1 Jinny → Mia, Mia, Mia in a row).
// Then, wherever two neighbors share a tutor, pull the next different tutor forward.
function spread<T>(lists: T[][]): T[] {
  const out = lists
    .flatMap((list, tutor) => {
      const offset = Math.random();
      return list.map((item, i) => ({ item, tutor, at: (i + offset) / list.length }));
    })
    .sort((a, b) => a.at - b.at);
  for (let i = 1; i < out.length; i++) {
    if (out[i].tutor !== out[i - 1].tutor) continue;
    const j = out.findIndex((x, k) => k > i && x.tutor !== out[i - 1].tutor);
    if (j !== -1) out.splice(i, 0, ...out.splice(j, 1));
  }
  return out.map((x) => x.item);
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
  const korean_tutors = (
    await Promise.all(KOREAN_TUTOR_SLUGS.map((slug) => fetchTutor(slug, locale)))
  ).filter((t): t is Tutor => t !== null);

  // Localized lesson titles; a failed fetch drops that lesson from the path, none left hides the section.
  const by_slug = new Map(korean_tutors.map((tu) => [tu.slug, tu]));
  const path_lessons = (
    await Promise.all(
      PATH_LESSONS.map(async ({ lesson_id, accent, sticker }): Promise<PathLesson | null> => {
        const l = await fetchLessonMeta(lesson_id, locale).catch(() => null);
        if (!l) return null;
        const tutor = by_slug.get(l.tutor_slug);
        return { tutor_name: tutor?.name ?? l.tutor_name, avatar: tutor?.profile_picture_url ?? null, title: l.localized_title.replace(/\s*\n\s*/g, " "), accent, sticker };
      })
    )
  ).filter((l): l is PathLesson => l !== null);

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
    // Starred clips only: unstarred recency fill never reaches the landing page (none
    // starred → [] → the static screenshot marquee below). Group by tutor and spread
    // each tutor evenly so names stay balanced along the row; shuffle for per-load variety.
    const by_tutor = new Map<string, MarketingClip[]>();
    for (const clip of await fetchMarketingClips(locale, { language: "korean" })) {
      const list = by_tutor.get(clip.tutor_name) ?? [];
      list.push(clip);
      by_tutor.set(clip.tutor_name, list);
    }
    clips = spread([...by_tutor.values()].map((l) => shuffle(l)));
  } catch {
    clips = [];
  }

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
              {t.rich("hero_title", { cool: (chunks) => <span className={`pe-cool ${lobster.className}`}>{chunks}</span> })}
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
                className={`inline-block rounded-full bg-[#89FFB4] px-8 py-2.5 md:py-3 text-base font-semibold ${tracking} text-[#18181C] hover:opacity-90 transition-opacity`}
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

      <TutorRoster title={t("roster_title")} subtitle={t("roster_subtitle")} tutors={korean_tutors} />
      <LessonLadder locale={locale} tutors={korean_tutors} />
      {path_lessons.length > 0 && <LessonPath title={t("path_title")} subtitle={t("path_subtitle")} lessons={path_lessons} />}
      <GardenGrow title={t("garden_title")} units={Array.from({ length: 30 }, (_, i) => t("garden_unit", { count: i + 1 }))} />

      <ReviewCards />
      <PageEnding />

      <SiteFooter appStoreBadge />
    </main>
  );
}
