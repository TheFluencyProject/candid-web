import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

const API_BASE_URL = "https://api.trydayli.com";
const APP_STORE_URL = "https://apps.apple.com/app/id6754859158";

interface TutorLanguageProficiency {
  language: string;
  level: string;
}

interface TutorMetadata {
  difficulty?: string;
  personality?: string;
  bio?: string;
  nowadays?: string;
  [key: string]: unknown;
}

interface Tutor {
  slug: string;
  name: string;
  title: string;
  short_description: string;
  city: string | null;
  birthday: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  profile_picture_url: string | null;
  large_profile_picture_url: string | null;
  intro_video_url: string | null;
  languages: TutorLanguageProficiency[];
  teaching_language: string;
  metadata: TutorMetadata | null;
}

async function fetchTutor(
  slug: string,
  locale: string
): Promise<Tutor | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/public/tutors/${slug}?locale=${locale}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatLanguages(languages: TutorLanguageProficiency[]): string {
  return languages
    .map((l) => {
      const name = capitalize(l.language);
      if (l.level === "native") return `${name} (native)`;
      return `${name} (${l.level})`;
    })
    .join(", ");
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tutor = await fetchTutor(slug, locale);

  if (!tutor) {
    return { title: "Guide Not Found — Dayli" };
  }

  const title = `${tutor.name} — Dayli`;
  const description = tutor.short_description;

  return {
    metadataBase: new URL("https://daylienglish.com"),
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "Dayli",
      images: tutor.large_profile_picture_url
        ? [{ url: tutor.large_profile_picture_url, alt: tutor.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: tutor.large_profile_picture_url
        ? [tutor.large_profile_picture_url]
        : [],
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tutor = await fetchTutor(slug, locale);
  if (!tutor) {
    notFound();
  }

  const has_social =
    tutor.instagram_handle || tutor.tiktok_handle || tutor.youtube_handle;

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#131212", color: "#FFFFFF" }}
    >
      {/* ─── Header ─── */}
      <header className="px-6 py-5 md:px-12">
        <a href="/">
          <Image
            src="/dayli-wordmark.svg"
            alt="Dayli"
            width={60}
            height={30}
            className="hover:opacity-80 transition-opacity"
          />
        </a>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative w-full overflow-hidden">
        {tutor.large_profile_picture_url ? (
          <div className="relative w-full aspect-[16/10] md:aspect-[16/7] max-h-[600px]">
            <img
              src={tutor.large_profile_picture_url}
              alt={tutor.name}
              className="w-full h-full object-cover object-top"
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, #131212 0%, rgba(19,18,18,0.7) 40%, rgba(19,18,18,0.2) 100%)",
              }}
            />
            {/* Text overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 md:px-12 md:pb-16">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-3">
                {tutor.name}
              </h1>
              <p className="text-lg md:text-2xl font-light opacity-90 max-w-2xl">
                {tutor.title}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 pt-16 pb-12 md:px-12 md:pt-24 md:pb-20">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-3">
              {tutor.name}
            </h1>
            <p className="text-lg md:text-2xl font-light opacity-90 max-w-2xl">
              {tutor.title}
            </p>
          </div>
        )}
      </section>

      {/* ─── CTA Button (below hero) ─── */}
      <section className="px-6 py-8 md:px-12 md:py-12">
        <a
          href={APP_STORE_URL}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#FFFFFF", color: "#131212" }}
        >
          Start Learning with {tutor.name.split(" ")[0]}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </a>
        <p className="mt-3 text-sm opacity-50">
          Free to try — no credit card required
        </p>
      </section>

      {/* ─── Divider ─── */}
      <div className="mx-6 md:mx-12 border-t border-white/10" />

      {/* ─── Guide Profile Section ─── */}
      <section className="px-6 py-12 md:px-12 md:py-16">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 max-w-4xl">
          {/* Avatar */}
          {tutor.profile_picture_url && (
            <div className="shrink-0">
              <img
                src={tutor.profile_picture_url}
                alt={tutor.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-semibold">
                {tutor.name}
              </h2>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#FFFFFF",
                }}
              >
                {capitalize(tutor.teaching_language)}
              </span>
            </div>

            <p className="text-lg font-light opacity-80 leading-relaxed">
              {tutor.short_description}
            </p>

            {tutor.metadata?.personality && (
              <p
                className="text-base italic"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {tutor.metadata.personality}
              </p>
            )}

            {tutor.metadata?.bio && (
              <p className="text-base font-light opacity-80 leading-relaxed mt-4">
                {tutor.metadata.bio}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div className="mx-6 md:mx-12 border-t border-white/10" />

      {/* ─── Details / Specs Cards ─── */}
      <section className="px-6 py-12 md:px-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl">
          {/* Teaching Language */}
          <div className="space-y-2">
            <p
              className="text-xs uppercase tracking-widest font-medium"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Teaches
            </p>
            <p className="text-lg font-semibold">
              {capitalize(tutor.teaching_language)}
            </p>
          </div>

          {/* City */}
          {tutor.city && (
            <div className="space-y-2">
              <p
                className="text-xs uppercase tracking-widest font-medium"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Based in
              </p>
              <p className="text-lg font-semibold">{tutor.city}</p>
            </div>
          )}

          {/* Languages */}
          {tutor.languages.length > 0 && (
            <div className="space-y-2 col-span-2">
              <p
                className="text-xs uppercase tracking-widest font-medium"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Speaks
              </p>
              <p className="text-lg font-semibold">
                {formatLanguages(tutor.languages)}
              </p>
            </div>
          )}

          {/* Difficulty */}
          {tutor.metadata?.difficulty && (
            <div className="space-y-2">
              <p
                className="text-xs uppercase tracking-widest font-medium"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Difficulty
              </p>
              <p className="text-lg font-semibold">
                {tutor.metadata.difficulty}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Nowadays / About Section ─── */}
      {tutor.metadata?.nowadays && (
        <>
          <div className="mx-6 md:mx-12 border-t border-white/10" />
          <section className="px-6 py-12 md:px-12 md:py-16 max-w-3xl">
            <h3
              className="text-xs uppercase tracking-widest font-medium mb-4"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              These Days
            </h3>
            <p className="text-lg font-light leading-relaxed opacity-80">
              {tutor.metadata.nowadays}
            </p>
          </section>
        </>
      )}

      {/* ─── Social Links ─── */}
      {has_social && (
        <>
          <div className="mx-6 md:mx-12 border-t border-white/10" />
          <section className="px-6 py-12 md:px-12 md:py-16">
            <h3
              className="text-xs uppercase tracking-widest font-medium mb-6"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Follow {tutor.name.split(" ")[0]}
            </h3>
            <div className="flex flex-wrap gap-4">
              {tutor.instagram_handle && (
                <a
                  href={`https://instagram.com/${tutor.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-full transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  <span className="text-sm font-medium">
                    @{tutor.instagram_handle}
                  </span>
                </a>
              )}

              {tutor.tiktok_handle && (
                <a
                  href={`https://tiktok.com/@${tutor.tiktok_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-full transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.2 8.2 0 005.58 2.17V11.7a4.85 4.85 0 01-3.77-1.24V6.69h3.77z" />
                  </svg>
                  <span className="text-sm font-medium">
                    @{tutor.tiktok_handle}
                  </span>
                </a>
              )}

              {tutor.youtube_handle && (
                <a
                  href={`https://youtube.com/@${tutor.youtube_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-full transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span className="text-sm font-medium">
                    @{tutor.youtube_handle}
                  </span>
                </a>
              )}
            </div>
          </section>
        </>
      )}

      {/* ─── Bottom CTA ─── */}
      <div className="mx-6 md:mx-12 border-t border-white/10" />
      <section className="px-6 py-16 md:px-12 md:py-24 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Start learning with {tutor.name.split(" ")[0]}
        </h2>
        <p className="text-lg font-light opacity-70 mb-8 max-w-lg mx-auto">
          {tutor.short_description}
        </p>
        <a
          href={APP_STORE_URL}
          className="inline-block"
        >
          <Image
            src="/download.svg"
            alt="Download on the App Store"
            width={170}
            height={55}
            className="hover:opacity-90 transition-opacity"
          />
        </a>
        <p className="mt-4 text-sm opacity-40">
          Free to try — no credit card required
        </p>
      </section>

      {/* ─── Footer ─── */}
      <footer
        className="px-6 py-8 md:px-12 flex items-center justify-between flex-wrap gap-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex gap-6 items-center">
          <a
            href="/privacy"
            className="text-sm opacity-50 hover:opacity-70 transition-opacity"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-sm opacity-50 hover:opacity-70 transition-opacity"
          >
            Terms of Use
          </a>
        </div>
        <p className="text-sm opacity-30">
          &copy; {new Date().getFullYear()} Dayli
        </p>
      </footer>
    </main>
  );
}
