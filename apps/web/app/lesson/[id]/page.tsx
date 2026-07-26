import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import BlurImage from "@/components/BlurImage";
import DownloadQRInterceptor from "@/components/DownloadQRInterceptor";
import { API_BASE_URL, fetchTutor } from "@/lib/api";
import { localizeLanguageName } from "@/lib/i18n-helpers";

const SHARE_DESCRIPTIONS: Record<"en" | "ko", string> = {
  en: "Candid is your guide to real, spoken language through a tutor's real life in the country.",
  ko: "Candid는 나만의 튜터가 보여주는 실생활 영어 프로그램입니다.",
};

// This route lives OUTSIDE the [locale] group (excluded from the next-intl matcher),
// so there's no translation context here — keep the little UI copy in a local map.
const COPY: Record<"en" | "ko", { cta: string; qrTitle: string; privacy: string; terms: string }> = {
  en: { cta: "Study in Candid", qrTitle: "Download Candid for iOS", privacy: "Privacy", terms: "Terms" },
  ko: { cta: "Candid에서 학습하기", qrTitle: "iOS용 Candid 다운로드", privacy: "개인정보", terms: "이용약관" },
};

// Band labels match the app's feed filter + dashboard wording.
const BAND_LABELS: Record<"en" | "ko", Record<string, string>> = {
  en: { upper_beginner: "Upper Beginner", lower_intermediate: "Lower Intermediate", intermediate: "Intermediate" },
  ko: { upper_beginner: "초중급", lower_intermediate: "중하급", intermediate: "중급" },
};

interface LessonMeta {
  lesson_id: string;
  source_id: string | null;
  source_type: string;
  orientation: "vertical" | "horizontal" | null;
  title: string;
  thumbnail_url: string;
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

function parseLocale(acceptLanguage: string | null): "en" | "ko" {
  if (!acceptLanguage) return "en";
  const primary = acceptLanguage.split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("ko")) return "ko";
  return "en";
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
  const locale = parseLocale(headersList.get("accept-language"));
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
  const locale = parseLocale(headersList.get("accept-language"));

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
  const aspect = isVertical ? "aspect-[9/16]" : "aspect-video";
  const tutorPhoto = tutor?.large_profile_picture_url ?? tutor?.profile_picture_url ?? null;

  // Subtitle = the lesson's level, e.g. "Upper Beginner Korean". Ungraded content has no band,
  // so it falls back to the language alone rather than showing nothing.
  const languageLabel = localizeLanguageName(lesson.teaching_language, locale);
  const bandLabel = lesson.difficulty_band ? BAND_LABELS[locale][lesson.difficulty_band] : null;
  const levelSubtitle = bandLabel ? `${bandLabel} ${languageLabel}` : languageLabel;

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
    >
      <header className="px-6 md:px-10 pt-8">
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

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-10 md:py-16 text-center">
        <div className={isVertical ? "w-full max-w-[300px]" : "w-full max-w-2xl"}>
          {lesson.thumbnail_url ? (
            <BlurImage
              src={lesson.thumbnail_url}
              alt={lesson.localized_title}
              className={`w-full ${aspect} object-cover rounded-[2rem] shadow-2xl`}
            />
          ) : (
            <div
              className={`w-full ${aspect} rounded-[2rem]`}
              style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
            />
          )}
        </div>

        <h1 className="mt-8 text-2xl md:text-3xl font-semibold max-w-xl leading-snug">
          {lesson.localized_title}
        </h1>
        <p className="mt-2 text-base md:text-lg font-light" style={{ color: "rgba(255,255,255,0.6)" }}>
          {levelSubtitle}
        </p>

        <div className="mt-6 inline-flex items-center gap-3">
          {tutorPhoto && (
            // Plain <img> direct from S3 — bypasses the /_next/image transcode hop.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tutorPhoto} alt={lesson.tutor_name} className="w-9 h-9 rounded-full object-cover" />
          )}
          <span className="text-base font-medium">{lesson.tutor_name}</span>
        </div>

        {/* /download/{slug} = this tutor's App Store link. On desktop the interceptor below
            swallows the click and pops a QR of it instead; mobile navigates normally. */}
        <a
          href={`/download/${lesson.tutor_slug}`}
          className="mt-8 inline-block px-12 py-3.5 rounded-full text-base font-bold"
          style={{ backgroundColor: "#89FFB4", color: "#000000" }}
        >
          {copy.cta}
        </a>
        <DownloadQRInterceptor label={copy.qrTitle} />
      </section>

      <footer
        className="px-6 py-6 flex items-center justify-between flex-wrap gap-4 text-sm"
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
