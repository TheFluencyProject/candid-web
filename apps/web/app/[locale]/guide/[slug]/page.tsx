import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

const API_BASE_URL = "https://dev.api.trydayli.com";
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

  const firstName = tutor.name.split(" ")[0];

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#131212", color: "#FFFFFF" }}
    >
      {/* ─── Sticky Navbar ─── */}
      <nav className="sticky top-0 z-50 w-full px-4 py-3 transition-colors duration-500 bg-[#131212]/60 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto flex justify-between items-center max-w-6xl">
          <a href="/" className="flex items-center gap-2">
            <Image
              src="/dayli-wordmark.svg"
              alt="Dayli"
              width={60}
              height={30}
              className="hover:opacity-80 transition-opacity"
            />
          </a>
          <div className="flex gap-2 items-center text-sm">
            <div className="flex items-center gap-[2px]">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-[14px] h-[14px] text-yellow-400">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="opacity-60 text-xs">4.9</span>
          </div>
        </div>
      </nav>

      {/* ─── Full-Viewport Hero ─── */}
      <section className="relative min-h-[85vh] lg:min-h-screen flex items-end overflow-hidden">
        {tutor.large_profile_picture_url ? (
          <img
            src={tutor.large_profile_picture_url}
            alt={tutor.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            }}
          />
        )}
        {/* Gradient overlays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, #131212 0%, rgba(19,18,18,0.8) 35%, rgba(19,18,18,0.2) 70%, rgba(19,18,18,0.3) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none hidden lg:block"
          style={{
            background: "linear-gradient(75deg, rgba(0,0,0,0.7) 0%, rgba(255,255,255,0) 60%)",
          }}
        />

        {/* Hero text content */}
        <div className="relative z-10 w-full px-6 pb-12 md:px-12 md:pb-16 lg:pb-20 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight mb-4 animate-fade-in-up">
            {tutor.name}
          </h1>
          <p className="text-xl md:text-2xl font-light opacity-90 max-w-xl mb-8 animate-fade-in-up-delay-1">
            {tutor.title}
          </p>
          <div className="animate-fade-in-up-delay-2">
            <a
              href={APP_STORE_URL}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FFFFFF", color: "#131212" }}
            >
              START FREE TRIAL
            </a>
            <p className="mt-3 text-sm opacity-50">
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* ─── Guide Profile Card ─── */}
      <section className="px-6 py-12 md:px-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center mb-6">
            {tutor.profile_picture_url && (
              <img
                src={tutor.profile_picture_url}
                alt={tutor.name}
                className="w-[200px] h-[200px] rounded-full object-cover shadow-2xl mb-6"
              />
            )}
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              {tutor.name}
            </h2>
            <p className="text-lg font-medium opacity-80 mb-4">{tutor.title}</p>
          </div>

          <div className="rounded-2xl p-6 border border-white/10" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            <p className="text-base leading-relaxed opacity-80 border-b border-white/10 pb-4 mb-4">
              {tutor.short_description}
            </p>

            {tutor.metadata?.personality && (
              <div className="py-3 mb-2">
                <div className="flex gap-2 items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-70">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                  </svg>
                  <h3 className="font-bold text-sm">Personality</h3>
                </div>
                <p className="opacity-70 text-sm">{tutor.metadata.personality}</p>
              </div>
            )}

            {tutor.metadata?.bio && (
              <>
                <hr className="border-white/10 my-2" />
                <div className="py-3 mb-2">
                  <div className="flex gap-2 items-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-70">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-sm">About</h3>
                  </div>
                  <p className="opacity-70 text-sm">{tutor.metadata.bio}</p>
                </div>
              </>
            )}

            {tutor.metadata?.nowadays && (
              <>
                <hr className="border-white/10 my-2" />
                <div className="py-3">
                  <div className="flex gap-2 items-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-70">
                      <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-sm">These Days</h3>
                  </div>
                  <p className="opacity-70 text-sm">{tutor.metadata.nowadays}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Structured Details Grid ─── */}
      <section className="px-6 py-8 md:px-12 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            {/* Teaches */}
            <div className="p-5 border-b md:border-b-0 md:border-r border-white/10">
              <p className="text-[10px] uppercase tracking-widest font-medium opacity-40 mb-2">Teaches</p>
              <p className="text-base font-bold">{capitalize(tutor.teaching_language)}</p>
            </div>

            {/* Difficulty */}
            <div className="p-5 border-b md:border-b-0 md:border-r border-white/10">
              <p className="text-[10px] uppercase tracking-widest font-medium opacity-40 mb-2">Difficulty</p>
              <p className="text-base font-bold">{tutor.metadata?.difficulty ?? "All levels"}</p>
            </div>

            {/* Based In */}
            <div className="p-5 md:border-r border-white/10">
              <p className="text-[10px] uppercase tracking-widest font-medium opacity-40 mb-2">Based in</p>
              <p className="text-base font-bold">{tutor.city ?? "—"}</p>
            </div>

            {/* Speaks */}
            <div className="p-5">
              <p className="text-[10px] uppercase tracking-widest font-medium opacity-40 mb-2">Speaks</p>
              <p className="text-base font-bold">
                {tutor.languages.length > 0 ? formatLanguages(tutor.languages) : "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How Dayli Works — Placeholder Screenshots ─── */}
      <section className="py-16 md:py-20">
        <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight mb-10 px-6">
          How Dayli Works
        </h2>
        <div className="flex gap-4 px-6 overflow-x-auto scrollbar-hide pb-4">
          {[
            { label: "Daily Lessons", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
            { label: "AI Conversations", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
            { label: "Progress Tracking", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
            { label: "Live Feedback", gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex-shrink-0 w-[260px] md:w-[280px] rounded-3xl flex items-end p-6"
              style={{
                background: item.gradient,
                aspectRatio: "9 / 16",
              }}
            >
              <p className="text-lg font-bold text-white drop-shadow-lg">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Social Links ─── */}
      {has_social && (
        <section className="px-6 py-12 md:px-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xs uppercase tracking-widest font-medium opacity-40 mb-6">
              Follow {firstName}
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {tutor.instagram_handle && (
                <a
                  href={`https://instagram.com/${tutor.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-full transition-colors hover:bg-white/10"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  <span className="text-sm font-medium">@{tutor.instagram_handle}</span>
                </a>
              )}
              {tutor.tiktok_handle && (
                <a
                  href={`https://tiktok.com/@${tutor.tiktok_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-full transition-colors hover:bg-white/10"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.2 8.2 0 005.58 2.17V11.7a4.85 4.85 0 01-3.77-1.24V6.69h3.77z" />
                  </svg>
                  <span className="text-sm font-medium">@{tutor.tiktok_handle}</span>
                </a>
              )}
              {tutor.youtube_handle && (
                <a
                  href={`https://youtube.com/@${tutor.youtube_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-full transition-colors hover:bg-white/10"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span className="text-sm font-medium">@{tutor.youtube_handle}</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── Bottom CTA ─── */}
      <section className="px-6 py-20 md:px-12 md:py-28 text-center">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
          Ready to learn{" "}
          <br className="md:hidden" />
          with {firstName}?
        </h2>
        <p className="text-lg font-light opacity-60 mb-10 max-w-lg mx-auto">
          {tutor.short_description}
        </p>
        <a href={APP_STORE_URL} className="inline-block">
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
      <footer className="px-6 py-8 md:px-12 flex items-center justify-between flex-wrap gap-4 border-t border-white/10">
        <div className="flex gap-6 items-center">
          <a href="/privacy" className="text-sm opacity-50 hover:opacity-70 transition-opacity">
            Privacy Policy
          </a>
          <a href="/terms" className="text-sm opacity-50 hover:opacity-70 transition-opacity">
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
