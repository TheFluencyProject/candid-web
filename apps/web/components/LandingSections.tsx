import { getTranslations } from "next-intl/server";
import TutorRoster from "@/components/TutorRoster";
import LessonLadder from "@/components/LessonLadder";
import LessonPath, { type PathLesson } from "@/components/LessonPath";
// import GardenGrow from "@/components/GardenGrow"; // garden section hidden for now (below)
import PageEnding from "@/components/PageEnding";
import ShadowDeck from "@/components/ShadowDeck";
import InputPhone, { type InputPhoneClip } from "@/components/InputPhone";
import { INPUT_CLIPS, DECK_SEED, text_in } from "@/lib/input-clips";
import ReviewCards from "@/components/ReviewCards";
import { type Tutor, type MarketingClip, type LessonMeta, fetchTutor, fetchMarketingClips, fetchLessonMeta } from "@/lib/api";
import { cover_position_x } from "@/lib/clip-crop";

// The home page's "about the app" sections, under its hero. Also rendered under the lesson share
// page's first screen (lesson-page-sections test), so it lives on its own rather than in SimpleLanding.

// object-position for a square cover-fit thumbnail: horizontal (16:9) ones centre on the saved focus x, vertical
// (9:16) ones on the tutor's framed focus y.
function square_thumb_position(l: LessonMeta): string {
  if (l.orientation === "horizontal") return `${cover_position_x(l.thumbnail_focus_x, 16 / 9, 1)} 50%`;
  const visible = 9 / 16, fy = l.thumbnail_focus_y;
  if (fy == null) return "50% 50%";
  return `50% ${Math.min(1, Math.max(0, (fy - visible / 2) / (1 - visible))) * 100}%`;
}

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

// The path section's three real lessons (Didi, Hayden, Grace: Adam's picks 11/17), each in its own lesson accent
// with one of its own stickers beside its indent coin (public/landing/path-<id>-{locked,accent}.webp, w × h).
// `title_id`: a part of a split video shows its full lesson's title, not the part's (Adam 11/18).
// `title_en`: Adam's own wording + Title Case for the English page (11/18); other locales keep the fetched title.
const PATH_LESSONS: { lesson_id: string; title_id?: string; title_en?: string; accent: string; sticker: PathLesson["sticker"] }[] = [
  { lesson_id: "b66d4cb2-701f-43fb-b9b4-a10ec5ffa75e", title_id: "976b8bd3-087c-43bf-9e37-376f71dee399", title_en: "Korean Superstitions 🧿", accent: "#3ADAFF", sticker: { id: "didi-scary", w: 280, h: 205 } }, // Didi, 무서운 이야기 Part 7
  { lesson_id: "9a2983f0-f768-49d7-8bce-7a73b92bcecc", title_id: "87641d82-ac46-48e5-8de1-1ed0b3e6edac", title_en: "Tour My Home With Me 🏠", accent: "#C8C5F0", sticker: { id: "hayden-home1", w: 280, h: 218 } }, // Hayden, Tour my Home Part 1
  { lesson_id: "09f99480-beb1-4269-8bf1-208f8d340dd0", accent: "#FDC39C", sticker: { id: "grace-kimchi", w: 173, h: 280 } }, // Grace, Making Kimchi
];

// Fisher–Yates. Runs server-side (the route is dynamic — page.tsx reads
// headers()), so the order is fixed before hydration — no SSR/client mismatch.
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

// Live starred clips, for home's hero phone and the shadowing section. A throw (backend hiccup, or the
// endpoint not deployed yet) returns [] — home's hero falls back to the static screenshot marquee.
export async function loadLandingClips(locale: string): Promise<MarketingClip[]> {
  try {
    // Home markets Korean — show only Korean creators' clips, not English tutors'.
    // Starred clips only: unstarred recency fill never reaches the landing page (none
    // starred → [] → the static screenshot marquee). Group by tutor and spread
    // each tutor evenly so names stay balanced along the row; shuffle for per-load variety.
    const by_tutor = new Map<string, MarketingClip[]>();
    for (const clip of await fetchMarketingClips(locale, { language: "korean" })) {
      const list = by_tutor.get(clip.tutor_name) ?? [];
      list.push(clip);
      by_tutor.set(clip.tutor_name, list);
    }
    return spread([...by_tutor.values()].map((l) => shuffle(l)));
  } catch {
    return [];
  }
}

// clips: pass the ones the page already loaded (home's hero shows them too), else they're loaded here.
// ctaHref: where the sections' download buttons go (default /download).
type Props = { locale: string; clips?: MarketingClip[]; ctaHref?: string };

export default async function LandingSections({ locale, clips, ctaHref }: Props) {
  const t = await getTranslations("home");
  // tracking-wide was tuned for the uppercase Latin labels; it just looks loose on Hangul.
  const tracking = locale === "ko" ? "" : "tracking-wide";
  const all_clips = clips ?? (await loadLandingClips(locale));

  // Promise.all + filter(null): a 404 drops out; a transient throw → Next serves
  // the last cached render (see fetchTutor) instead of a blank row.
  const korean_tutors = (
    await Promise.all(KOREAN_TUTOR_SLUGS.map((slug) => fetchTutor(slug, locale)))
  ).filter((t): t is Tutor => t !== null);

  // Localized lesson titles; a failed fetch drops that lesson from the path, none left hides the section.
  const by_slug = new Map(korean_tutors.map((tu) => [tu.slug, tu]));
  const path_lessons = (
    await Promise.all(
      PATH_LESSONS.map(async ({ lesson_id, title_id, title_en, accent, sticker }): Promise<PathLesson | null> => {
        const [l, full] = await Promise.all([
          fetchLessonMeta(lesson_id, locale).catch(() => null),
          title_id ? fetchLessonMeta(title_id, locale).catch(() => null) : null,
        ]);
        if (!l) return null;
        const tutor = by_slug.get(l.tutor_slug);
        return { tutor_name: tutor?.name ?? l.tutor_name, avatar: tutor?.profile_picture_url ?? null, thumb: l.thumbnail_url ? { url: l.thumbnail_url, pos: square_thumb_position(l) } : null, title: (locale === "en" && title_en) || (full ?? l).localized_title.replace(/\s*\n\s*/g, " "), accent, sticker };
      })
    )
  ).filter((l): l is PathLesson => l !== null);

  // The shadowing section's cards: the same starred clips, starting halfway through so its phone
  // never opens on the hero's clip. Only lines with word timings (karaoke + the hidden word) that fit
  // the card in two rows; a handful is plenty for the loop. Fewer than 2 hides the section.
  const SHADOW_MAX_CHARS = 15; // Korean characters, spaces not counted: 17 already wraps to 3 rows
  const shadow_clips = [...all_clips.slice(Math.floor(all_clips.length / 2)), ...all_clips.slice(0, Math.floor(all_clips.length / 2))]
    .filter((c) => (c.word_level_captions?.length ?? 0) > 0 && c.text.replace(/\s/g, "").length <= SHADOW_MAX_CHARS)
    .slice(0, 5);

  // The comprehensible-input section's four lines, in the page's language. Titles are fetched live (cached
  // a week, like the path's); a failed fetch keeps the English title.
  const input_clips: InputPhoneClip[] = await Promise.all(
    INPUT_CLIPS.map(async (c) => {
      const meta = await fetchLessonMeta(c.lesson_id, locale).catch(() => null);
      return {
        title: meta?.localized_title.replace(/\s*\n\s*/g, " ") || c.title,
        mux_playback_id: c.mux_playback_id,
        start: c.start,
        end: c.end,
        avatar: c.avatar,
        bars: c.bars,
        chips: c.chips,
        star: c.star,
        bubble: [c.bubble[0], text_in(c.bubble[1], locale)],
        peek: [c.peek[0], c.peek[1], text_in(c.peek[2], locale)],
        translation: text_in(c.translation, locale),
      };
    })
  );

  return (
    <>
      {/* Section order (Adam 11/17): content → steps → listening → speaking → students → creators → garden → stickers.
          The listening (comprehensible input) section sits between the path and ShadowDeck. */}
      <LessonLadder locale={locale} tutors={korean_tutors} ctaHref={ctaHref} />
      {path_lessons.length > 0 && <LessonPath title={t("path_title")} subtitle={t("path_subtitle")} ctaLabel={t("cta_learn")} ctaHref={ctaHref} tracking={tracking} lessons={path_lessons} />}
      <InputPhone ctaLabel={t("cta_learn")} ctaHref={ctaHref} tracking={tracking} tag={t("input_tag")} title={t("input_title")} subtitle={t("input_subtitle")} seeMore={t("input_see_more")} clips={input_clips} seed={[DECK_SEED[0], text_in(DECK_SEED[1], locale)]} />
      <ShadowDeck ctaLabel={t("cta_learn")} ctaHref={ctaHref} tracking={tracking} tag={t("shadow_tag")} title={t("shadow_title")} subtitle={t("shadow_subtitle")} clips={shadow_clips} />
      <ReviewCards />
      <TutorRoster title={t("roster_title")} subtitle={t("roster_subtitle")} tutors={korean_tutors} />
      {/* Garden section hidden for now (Adam 11/19): it's confusing, and 2 of 2 viewers so far stopped halfway
          through it and scrolled back up. To restore, uncomment this and its import (GardenGrow.tsx + its CSS are kept).
      <GardenGrow title={t("garden_title")} units={Array.from({ length: 30 }, (_, i) => t("garden_unit", { count: i + 1 }))} /> */}
      <PageEnding tracking={tracking} ctaHref={ctaHref} />
    </>
  );
}
