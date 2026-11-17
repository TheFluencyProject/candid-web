import { getTranslations } from "next-intl/server";
import { type LessonMeta, type Tutor, fetchLessonMeta } from "@/lib/api";
import { cover_position_x } from "@/lib/clip-crop";
import DownloadCta from "@/components/DownloadCta";

// "Korean lessons for every level" (mockup C2, Adam 11/11–11/17): one real lesson per level, Beginner →
// Upper Intermediate, read left to right down two staggered columns, with the heading beside them.
// Prod has no Advanced Korean lesson yet, so the ladder stops at Upper Intermediate (plan Q3); add the
// sixth entry here once one exists. Levels are fixed here (Jinny's lesson is difficulty_level
// upper_intermediate, though its public band reads intermediate).
type Level = "beginner" | "upper_beginner" | "lower_intermediate" | "intermediate" | "upper_intermediate" | "advanced";
const LADDER: { lesson_id: string; level: Level }[] = [
  { lesson_id: "97c601b9-8aef-4bac-9660-255e4be267c2", level: "beginner" }, // Hayden, Let's Take a Walk
  { lesson_id: "3db9ba64-ef93-4303-bd7c-da4a942dfea2", level: "upper_beginner" }, // Hansoo, Catching Up at a Cafe
  { lesson_id: "44a2d5ab-2a1e-4632-9422-200540b4dd89", level: "lower_intermediate" }, // Mia, Rainy Day in Hanok
  { lesson_id: "af576996-875e-44b0-b082-a1ed3f23ef4f", level: "intermediate" }, // Didi, Welcome to the Late-Night Show
  { lesson_id: "f5f94e25-11e5-4280-9b58-0801affa42b1", level: "upper_intermediate" }, // Jinny, Why Koreans Visit Doctors So Often
];

// Site-only level colors (Adam 11/17). The card's bottom panel and its top-left tag share it.
const LEVEL_COLOR: Record<Level, string> = {
  beginner: "#89FFB4",
  upper_beginner: "#7AE6E5",
  lower_intermediate: "#A4D8FE",
  intermediate: "#C9B8FF",
  upper_intermediate: "#EDB8F2",
  advanced: "#FFBFB8",
};

// The thumbnail's box is the 2:3 card minus its panel: about 0.9 wide-to-tall.
const BOX_ASPECT = 0.9;

// object-position for a cover-fit thumbnail: horizontal (16:9) ones centre on the saved focus x, vertical
// (9:16) ones on the tutor's framed focus y.
function thumb_position(l: LessonMeta): string {
  if (l.orientation === "horizontal") return `${cover_position_x(l.thumbnail_focus_x, 16 / 9, BOX_ASPECT)} 50%`;
  const visible = Math.min(9 / 16 / BOX_ASPECT, 1);
  const fy = l.thumbnail_focus_y;
  if (fy == null || visible >= 1) return "50% 50%";
  return `50% ${Math.min(1, Math.max(0, (fy - visible / 2) / (1 - visible))) * 100}%`;
}

type Card = { lesson: LessonMeta; level: Level };

function LessonCard({ lesson, level, tutor, label }: Card & { tutor: Tutor | undefined; label: string }) {
  const avatar = tutor?.profile_picture_url;
  return (
    <div
      className="relative flex aspect-[2/3] flex-col overflow-hidden rounded-[20px] min-[600px]:rounded-[22px] border border-white/[0.08] bg-[#111]"
      style={{ ["--lv" as string]: LEVEL_COLOR[level] }}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Real thumbnails only, never a random frame. */}
        <img src={lesson.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: thumb_position(lesson) }} />
        {/* Shaped like the app's CardSticker; always the panel's color. */}
        <span className="absolute left-2 top-2 min-[860px]:left-2.5 min-[860px]:top-2.5 z-[2] flex h-6 min-[860px]:h-7 items-center whitespace-nowrap rounded-[7px] bg-[var(--lv)] px-2 min-[860px]:px-2.5 text-[11px] min-[860px]:text-[13px] font-semibold text-[#141414] shadow-[0_2px_8px_rgba(0,0,0,.25)]">
          {label}
        </span>
      </div>
      <div className="relative z-[1] bg-[var(--lv)] px-[11px] pb-3 pt-2.5 min-[860px]:px-4 min-[860px]:pb-4 min-[860px]:pt-3.5 text-[#141414]">
        <div className="text-sm min-[860px]:text-[17px] font-semibold leading-[1.25] tracking-[-0.01em]">
          {lesson.localized_title.replace(/\s*\n\s*/g, " ")}
        </div>
        {/* The tutor's name is a solid gray, never faded; the photo is full strength (Adam 11/17). */}
        <div className="mt-1.5 min-[860px]:mt-2 flex items-center gap-[7px] text-xs min-[860px]:text-sm font-medium text-[#4B4B50]">
          {avatar && <img src={avatar} alt="" className="h-4 w-4 min-[860px]:h-5 min-[860px]:w-5 rounded-full object-cover" />}
          {tutor?.name ?? lesson.tutor_name}
        </div>
      </div>
    </div>
  );
}

export default async function LessonLadder({ locale, tutors }: { locale: string; tutors: Tutor[] }) {
  const t = await getTranslations("home");
  // A failed fetch drops that card (a hiccup here shouldn't take the home page down with it).
  const cards = (
    await Promise.all(
      LADDER.map(async ({ lesson_id, level }) => {
        const lesson = await fetchLessonMeta(lesson_id, locale).catch(() => null);
        return lesson ? { lesson, level } : null;
      })
    )
  ).filter((c): c is Card => c !== null);
  // Fewer than 4 can't show "every level": hide the section.
  if (cards.length < 4) return null;

  const by_slug = new Map(tutors.map((tu) => [tu.slug, tu]));
  const card = (c: Card) => (
    <LessonCard key={c.lesson.lesson_id} {...c} tutor={by_slug.get(c.lesson.tutor_slug)} label={t(`levels.${c.level}`)} />
  );
  // Read left to right: even indexes down the first column, odd down the second.
  const columns = [cards.filter((_, i) => i % 2 === 0), cards.filter((_, i) => i % 2 === 1)];

  return (
    // At least one screen under the top bar (Adam 11/17); this one can run taller.
    <section className="flex min-h-[calc(100svh-61px)] flex-col justify-center py-16">
      {/* Cards always get the bigger share (3:2), so the heading side never feels wider (Adam 11/17).
          overflow-clip, not hidden, on ancestors: hidden would break the sticky heading. */}
      <div className="mx-auto grid w-full max-w-[1040px] grid-cols-1 items-start gap-8 px-4 min-[860px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] min-[860px]:gap-[clamp(32px,5vw,72px)] min-[860px]:px-8">
        {/* One gap both ways (24px, 12px on phones); the second column sits a bit lower: 35% of a
            column's width, about a quarter card, not a half-card checkerboard (Adam 11/17). */}
        <div className="mx-auto grid w-full max-w-[480px] grid-cols-2 gap-3 min-[860px]:max-w-none min-[860px]:gap-6">
          {columns.map((col, i) => (
            <div key={i} className={`flex flex-col gap-3 min-[860px]:gap-6 ${i === 1 ? "mt-[35%]" : ""}`}>
              {col.map(card)}
            </div>
          ))}
        </div>
        {/* Phones: heading first, centered. Desktop: on the right, left-aligned, level with the first card's
            top, then held at the top bar + 24px + 14vh while the cards scroll (Adam 11/17). */}
        <div className="order-first text-center [word-break:keep-all] min-[860px]:order-none min-[860px]:sticky min-[860px]:top-[calc(61px+24px+14vh)] min-[860px]:text-left">
          <h2 className="text-[30px] font-medium leading-[1.08] tracking-[-0.03em] [text-wrap:balance] min-[860px]:text-[clamp(36px,4vw,54px)]">
            {t("lessons_title")}
          </h2>
          <p className="mt-4 text-base leading-normal text-gray-300 [text-wrap:balance] min-[860px]:text-[19px]">{t("lessons_subtitle")}</p>
          <DownloadCta label={t("cta_learn")} tracking={locale === "ko" ? "" : "tracking-wide"} className="mt-6" color={LEVEL_COLOR.lower_intermediate} />
        </div>
      </div>
    </section>
  );
}
