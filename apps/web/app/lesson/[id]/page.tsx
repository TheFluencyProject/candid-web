import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import BlurImage from "@/components/BlurImage";
import DownloadQRInterceptor from "@/components/DownloadQRInterceptor";
import { API_BASE_URL, fetchTutor } from "@/lib/api";
import { pickLocale } from "@/lib/i18n-helpers";
// import { localizeLanguageName } from "@/lib/i18n-helpers";

const SHARE_DESCRIPTIONS: Record<"en" | "ko", string> = {
  en: "Candid is your guide to real, spoken language through a tutor's real life in the country.",
  ko: "Candid는 나만의 튜터가 보여주는 실생활 영어 프로그램입니다.",
};

// This route lives OUTSIDE the [locale] group (excluded from the next-intl matcher),
// so there's no translation context here — keep the little UI copy in a local map.
const COPY: Record<"en" | "ko", { cta: string; qrTitle: string; privacy: string; terms: string }> = {
  en: { cta: "Study with Candid", qrTitle: "Download Candid for iOS", privacy: "Privacy", terms: "Terms" },
  ko: { cta: "Candid에서 공부하기", qrTitle: "iOS용 Candid 다운로드", privacy: "개인정보", terms: "이용약관" },
};

// Band labels match the app's feed filter + dashboard wording.
// const BAND_LABELS: Record<"en" | "ko", Record<string, string>> = {
//   en: { upper_beginner: "Upper Beginner", lower_intermediate: "Lower Intermediate", intermediate: "Intermediate" },
//   ko: { upper_beginner: "초중급", lower_intermediate: "중하급", intermediate: "중급" },
// };

interface LessonMeta {
  lesson_id: string;
  source_id: string | null;
  source_type: string;
  orientation: "vertical" | "horizontal" | null;
  title: string;
  thumbnail_url: string;
  // Centre of the full-width square the tutor framed, 0-1 of image height. Optional so the page
  // keeps working against an API that predates the field; null/absent = plain centring.
  thumbnail_focus_y?: number | null;
  localized_title: string;
  tutor_name: string;
  tutor_slug: string;
  teaching_language: string;
  difficulty_band: string | null;
}

// Returns null only for genuine 404 ("no such lesson"). Transient failures
// (timeout, 5xx, network) THROW so Next.js keeps the previous good cached
// value instead of caching the failure for the 1-week revalidate window.
async function fetchLessonMeta(id: string, locale: string): Promise<LessonMeta | null> {
  const res = await fetch(`${API_BASE_URL}/public/lessons/${id}?locale=${locale}`, {
    next: { revalidate: 604800 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`fetchLessonMeta(${id}, ${locale}): HTTP ${res.status}`);
  }
  return res.json();
}

function buildTitle(lesson: LessonMeta | null): string {
  const title = lesson?.localized_title;
  if (!title) return "Candid";
  if (lesson.tutor_name) return `${lesson.tutor_name} on Candid: ${title}`;
  return `Candid: ${title}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const headersList = await headers();
  const locale = pickLocale(headersList.get("accept-language"));
  const lesson = await fetchLessonMeta(id, locale);

  const title = buildTitle(lesson);
  const description = SHARE_DESCRIPTIONS[locale];

  return {
    metadataBase: new URL("https://joincandid.co"),
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "Candid",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const locale = pickLocale(headersList.get("accept-language"));

  const lesson = await fetchLessonMeta(id, locale);
  if (!lesson) notFound();

  // Tutor branding is best-effort: a hiccup fetching the tutor must not crash the
  // lesson page, so fall back to no-branding (null) rather than letting fetchTutor throw.
  const tutor = lesson.tutor_slug
    ? await fetchTutor(lesson.tutor_slug, locale).catch(() => null)
    : null;

  const copy = COPY[locale];
  // orientation is nullable; default to vertical framing (matches shorts-style content).
  const isVertical = lesson.orientation !== "horizontal";
  // Crop height/width. Vertical gets a little more height than width; horizontal is square.
  // Both sit well under the 1.472 the dashboard FramePicker clamps the saved focus against
  // (HERO_CARD_ASPECT), so the crop can never pull blank space in above or below the square.
  const frameRatio = isVertical ? 1.2 : 1;
  // Height everything else in the viewport block takes — header, gaps, a two-line title, tutor
  // row, CTA. Measured off the rendered page at the longest title we ship, not guessed. The frame
  // gets what's left, so on a short screen it shrinks instead of pushing the CTA below the fold.
  const RESERVED_PX = 300;
  const frameStyle = {
    aspectRatio: `1 / ${frameRatio}`,
    width: `min(300px, calc((100svh - ${RESERVED_PX}px) / ${frameRatio}))`,
  };
  // Focus only ever describes a vertical source; clamp like FocusFilledWebImage does on iOS.
  const focusY =
    isVertical && typeof lesson.thumbnail_focus_y === "number"
      ? Math.min(Math.max(lesson.thumbnail_focus_y, 0), 1)
      : null;
  const tutorPhoto = tutor?.large_profile_picture_url ?? tutor?.profile_picture_url ?? null;

  // Level subtitle ("Upper Beginner Korean") hidden for now — see the JSX below.
  // const languageLabel = localizeLanguageName(lesson.teaching_language, locale);
  // const bandLabel = lesson.difficulty_band ? BAND_LABELS[locale][lesson.difficulty_band] : null;
  // const levelSubtitle = bandLabel ? `${bandLabel} ${languageLabel}` : languageLabel;

  return (
    <main className="flex flex-col" style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}>
      {/* One viewport tall, so the CTA is always reachable without scrolling and the footer
          still starts below the fold. svh, not vh — vh on mobile Safari is the URL-bar-hidden
          viewport, which is what pushed the CTA off screen. */}
      <div className="min-h-[100svh] flex flex-col">
        <header className="px-5 md:px-10 pt-5">
          <Link href="/" className="inline-block">
            <Image
              src="/wordmark-white.svg"
              alt="Candid"
              width={72}
              height={36}
              priority
              className="hover:opacity-80 transition-opacity"
            />
          </Link>
        </header>

        <section className="flex-1 flex flex-col items-center justify-center px-5 py-4 text-center">
          {lesson.thumbnail_url ? (
            <div
              className="relative max-w-full overflow-hidden rounded-[1.75rem] shadow-2xl"
              style={
                focusY != null
                  ? {
                      ...frameStyle,
                      // Fallback layer for the one case the crop below can't cover: a barely-portrait
                      // source (ratio under the frame's) leaves a strip once the fill binds on width.
                      // iOS re-binds on height there; here the same image, centre-cropped, fills it.
                      backgroundImage: `url(${lesson.thumbnail_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : frameStyle
              }
            >
              {focusY != null ? (
                // The tutor framed a full-width SQUARE centred at focusY. iOS pins that square's top
                // to the frame top on taller-than-square cards (FocusFilledWebImage.focusYOffset), so
                // the image top sits at frameW/2 − focusY·imgH. Percentage margins resolve against the
                // containing block's WIDTH, so mt-[50%] is exactly frameW/2; translateY% resolves
                // against this wrapper's own height, which is the image's rendered height.
                // The offset lives on the wrapper because BlurImage owns the img's own transform.
                <div className="absolute inset-x-0 top-0 mt-[50%]" style={{ transform: `translateY(${-focusY * 100}%)` }}>
                  <BlurImage
                    src={lesson.thumbnail_url}
                    alt={lesson.localized_title}
                    // `auto 9/16` = use the real ratio once decoded, else assume 9:16 (same cold-load
                    // guess as iOS's cachedAspect) — without it the wrapper is the 150px default
                    // height until decode and the crop visibly jumps.
                    className="block w-full h-auto aspect-[auto_9/16]"
                  />
                </div>
              ) : (
                <BlurImage
                  src={lesson.thumbnail_url}
                  alt={lesson.localized_title}
                  className="block w-full h-full object-cover"
                />
              )}
            </div>
          ) : (
            <div
              className="max-w-full rounded-[1.75rem]"
              style={{ ...frameStyle, background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
            />
          )}

          <h1 className="mt-5 text-2xl md:text-3xl font-semibold max-w-xl leading-snug">
            {lesson.localized_title}
          </h1>
          {/* Hidden for now. Title → tutor row falls back to mt-6, the same layout this had
              whenever the old category subtitle was null. */}
          {/* <p className="mt-2 text-base md:text-lg font-light" style={{ color: "rgba(255,255,255,0.6)" }}>
            {levelSubtitle}
          </p> */}

          <div className="mt-4 inline-flex items-center gap-3">
            {tutorPhoto && (
              // Plain <img> direct from S3 — bypasses the /_next/image transcode hop.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tutorPhoto} alt={lesson.tutor_name} className="w-9 h-9 rounded-full object-cover" />
            )}
            <span className="text-base font-medium">{lesson.tutor_name}</span>
          </div>

          {/* /download/{slug} = this tutor's App Store link. On desktop the interceptor below
              swallows the click and pops a QR of the equivalent /qr/{slug} link (same
              destination, but scannable without tripping the App Clip card); mobile navigates
              normally. Either way the click is tracked as study_cta_clicked. */}
          <a
            href={`/download/${lesson.tutor_slug}`}
            className="mt-5 inline-block px-12 py-3.5 rounded-full text-base font-bold"
            style={{ backgroundColor: "#89FFB4", color: "#000000" }}
          >
            {copy.cta}
          </a>
          <DownloadQRInterceptor label={copy.qrTitle} />
        </section>
      </div>

      <footer
        className="px-5 py-6 flex items-center justify-between flex-wrap gap-4 text-sm"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        <p>&copy; {new Date().getFullYear()} The Fluency Project Inc.</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:opacity-70 transition-opacity">
            {copy.privacy}
          </Link>
          <Link href="/terms" className="hover:opacity-70 transition-opacity">
            {copy.terms}
          </Link>
        </div>
      </footer>
    </main>
  );
}
