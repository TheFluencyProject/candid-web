import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import MobileCTABar from "@/components/MobileCTABar";
import GuideNavbar from "@/components/GuideNavbar";
import QRCode from "@/components/QRCode";
import { getTutorPageConfig } from "@/config/tutors";
import StickyHeader from "@/components/StickyHeader";

const API_BASE_URL = "https://dev.api.joincandid.co";
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
  content_style?: string;
  designed_for?: string;
  interests?: string;
  cool_title?: string;
  cool_title_kr?: string;
  web_bg_picture?: string;
  screenshot_listen?: string;
  screenshot_week?: string;
  screenshot_learn?: string;
  screenshot_shadow?: string;
  screenshot_intro?: string;
  name_kr?: string;
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

function formatHeroTitle(text: string): string {
  // Pattern: "Your guide to [TOPIC] & [REST]"
  // Wrap everything after "to " in accent font, with line breaks
  const toMatch = text.match(/^(.*?\bto\s)(.+?)(\s&\s)(.+)$/i);
  if (toMatch) {
    const [, prefix, topic, amp, rest] = toMatch;
    return (
      `${prefix}<span class="hero-break-mobile"></span>` +
      `<em>${topic}</em>` +
      `<span class="hero-break-all"></span>` +
      `${amp}<em>${rest}</em>`
    );
  }
  return text;
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
    return { title: "Guide Not Found — Candid" };
  }

  const langLabel = capitalize(tutor.teaching_language);
  const title = `Candid | ${langLabel} with ${tutor.name}`;
  const description = tutor.short_description;
  const ogImage = (tutor.metadata?.web_bg_picture as string) || tutor.large_profile_picture_url;

  return {
    metadataBase: new URL("https://joincandid.co"),
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "Candid",
      images: ogImage ? [{ url: ogImage, alt: tutor.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [tutor, t] = await Promise.all([
    fetchTutor(slug, locale),
    getTranslations("guide"),
  ]);
  if (!tutor) {
    notFound();
  }

  const has_social =
    tutor.instagram_handle || tutor.tiktok_handle || tutor.youtube_handle;

  const firstName = tutor.name.split(" ")[0];
  const localizedFirstName =
    locale === "ko" && tutor.metadata?.name_kr
      ? (tutor.metadata.name_kr as string)
      : firstName;
  const langLabel = capitalize(tutor.teaching_language);
  const config = getTutorPageConfig(slug);
  const rawCoolTitle =
    locale === "ko"
      ? (tutor.metadata?.cool_title_kr ?? tutor.metadata?.cool_title ?? tutor.title)
      : (tutor.metadata?.cool_title ?? tutor.title);
  const coolTitle = formatHeroTitle(rawCoolTitle);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#131212", color: "#FFFFFF" }}
    >
      {/* ─── Fixed Navbar ─── */}
      <GuideNavbar sentinelId="hero-sentinel" downloadUrl={`/download/${slug}`} />

      {/* ─── Full-Viewport Hero ─── */}
      <section className="relative min-h-[80vh] lg:min-h-screen overflow-hidden">
        {/* Photo background */}
        {(tutor.metadata?.web_bg_picture || tutor.large_profile_picture_url) ? (
          <>
            {/* Desktop photo */}
            <img
              src={(tutor.metadata?.web_bg_picture as string) || tutor.large_profile_picture_url!}
              alt={tutor.name}
              className="absolute inset-0 w-full h-full object-cover hidden lg:block"
              style={{ objectPosition: config.photo.desktop }}
            />
            {/* Mobile photo */}
            <img
              src={(tutor.metadata?.web_bg_picture as string) || tutor.large_profile_picture_url!}
              alt={tutor.name}
              className="absolute inset-0 w-full h-full object-cover lg:hidden scale-[1.15] origin-bottom"
              style={{ objectPosition: config.photo.mobile }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            }}
          />
        )}

        {/* Bottom fade into background color — desktop */}
        <div
          className="absolute inset-0 pointer-events-none hidden lg:block"
          style={{
            background:
              "linear-gradient(to bottom, transparent 70%, #131212 100%)",
          }}
        />
        {/* Bottom fade into background color — mobile */}
        <div
          className="absolute inset-0 pointer-events-none lg:hidden"
          style={{
            background:
              "linear-gradient(to bottom, transparent 35%, rgba(19,18,18,0.4) 50%, rgba(19,18,18,0.7) 65%, rgba(19,18,18,0.85) 80%, #131212 95%)",
          }}
        />

        {/* Desktop text content — left side */}
        <div className="relative z-10 hidden lg:flex flex-col justify-center min-h-screen px-12 pt-16 pb-24">
          <h1
            className="hero-heading text-5xl xl:text-6xl font-light leading-[1.15] mb-6 animate-fade-in-up"
            style={{ color: "#131212" }}
            dangerouslySetInnerHTML={{ __html: coolTitle }}
          />
          <p
            className="text-base xl:text-lg font-light leading-relaxed mb-10 max-w-md animate-fade-in-up-delay-1"
            style={{ color: "#131212", opacity: 0.7 }}
            dangerouslySetInnerHTML={{ __html: t("subtitle", { name: localizedFirstName, language: langLabel }) }}
          />
          <div className="animate-fade-in-up-delay-2">
            <QRCode slug={slug} label={t("download_qr")} />
          </div>
        </div>

        {/* Mobile text content — bottom, centered */}
        <div className="relative z-10 lg:hidden flex flex-col items-center justify-end min-h-[80vh] px-6 pb-10 text-center">
          <h1
            className="hero-heading text-3xl sm:text-4xl font-light leading-tight mb-4 animate-fade-in-up"
            style={{ color: "#FFFFFF" }}
            dangerouslySetInnerHTML={{ __html: coolTitle }}
          />
          <p
            className="text-base font-normal leading-relaxed max-w-sm animate-fade-in-up-delay-1 [&_br]:hidden"
            style={{ color: "rgba(255,255,255,0.7)" }}
            dangerouslySetInnerHTML={{ __html: t("subtitle", { name: localizedFirstName, language: langLabel }) }}
          />
        </div>

        {/* "Tutor [Name]" label + arrow — desktop */}
        <div
          className="absolute z-10 hidden lg:flex flex-col items-center animate-fade-in-up-delay-3"
          style={{
            top: config.arrow.desktop.top,
            left: config.arrow.desktop.left,
            transform: config.arrow.desktop.rotation
              ? `rotate(${config.arrow.desktop.rotation})`
              : undefined,
          }}
        >
          <img
            src="/curved-arrow.svg"
            alt=""
            className="w-12 h-12 -mb-2"
          />
          <span
            className="text-2xl text-white"
            style={{ fontFamily: "'Sriracha', cursive" }}
          >
            {t("tutor_label", { firstName: localizedFirstName })}
          </span>
        </div>

        {/* "Tutor [Name]" label + arrow — mobile */}
        <div
          className="absolute z-10 lg:hidden flex flex-col items-center animate-fade-in-up-delay-3"
          style={{
            top: config.arrow.mobile.top,
            right: config.arrow.mobile.right,
            transform: config.arrow.mobile.rotation
              ? `rotate(${config.arrow.mobile.rotation})`
              : undefined,
          }}
        >
          <img
            src="/curved-arrow.svg"
            alt=""
            className="w-9 h-9 -mb-1"
          />
          <span
            className="text-lg text-white"
            style={{ fontFamily: "'Sriracha', cursive" }}
          >
            {t("tutor_label", { firstName: localizedFirstName })}
          </span>
        </div>

        {/* Sentinel for navbar wordmark swap — at ~80% height */}
        <div id="hero-sentinel" className="absolute w-full h-1" style={{ top: "60%" }} />
      </section>

      {/* ─── Guide Profile Card ─── */}
      <section className="px-6 pt-20 pb-12 md:px-12 md:pt-24 md:pb-16">
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
                  <h3 className="font-bold text-sm">{t("personality")}</h3>
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
                    <h3 className="font-bold text-sm">{t("about")}</h3>
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
                    <h3 className="font-bold text-sm">{t("these_days")}</h3>
                  </div>
                  <p className="opacity-70 text-sm">{tutor.metadata.nowadays}</p>
                </div>
              </>
            )}

            <hr className="border-white/10 my-2" />
            <div className="py-3">
              <div className="flex gap-2 items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-70">
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.318.178-.529.372-.529.56 0 .194.21.39.529.564.1.058.205.108.316.153z" />
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.514.107.983.276 1.387.517.669.399 1.113.965 1.113 1.683 0 .718-.444 1.284-1.113 1.683-.404.241-.873.41-1.387.517v.332a.75.75 0 01-1.5 0v-.332a3.78 3.78 0 01-1.653-.717A2.6 2.6 0 015.8 12.1a.75.75 0 011.4-.55c.079.2.207.364.411.527.268.214.618.38 1.039.474v-2.8a5.038 5.038 0 01-1.388-.515C6.596 8.838 6.15 8.272 6.15 7.553c0-.718.444-1.284 1.113-1.683A5.022 5.022 0 018.75 5.066V4.75A.75.75 0 019.5 4h.5z" clipRule="evenodd" />
                </svg>
                <h3 className="font-bold text-sm">{t("teaches")}</h3>
              </div>
              <p className="opacity-70 text-sm">{capitalize(tutor.teaching_language)}</p>
            </div>

            <hr className="border-white/10 my-2" />
            <div className="py-3">
              <div className="flex gap-2 items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-70">
                  <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
                </svg>
                <h3 className="font-bold text-sm">{t("difficulty")}</h3>
              </div>
              <p className="opacity-70 text-sm">{tutor.metadata?.difficulty ?? t("all_levels")}</p>
            </div>

            {tutor.city && (
              <>
                <hr className="border-white/10 my-2" />
                <div className="py-3">
                  <div className="flex gap-2 items-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-70">
                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-sm">{t("based_in")}</h3>
                  </div>
                  <p className="opacity-70 text-sm">{tutor.city}</p>
                </div>
              </>
            )}

            {tutor.languages.length > 0 && (
              <>
                <hr className="border-white/10 my-2" />
                <div className="py-3">
                  <div className="flex gap-2 items-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-70">
                      <path d="M7.75 2.75a.75.75 0 00-1.5 0v1.258a32.987 32.987 0 00-3.599.278.75.75 0 10.198 1.487A31.545 31.545 0 018.7 5.545 19.381 19.381 0 017 9.56a19.418 19.418 0 01-1.002-2.05.75.75 0 00-1.384.577 20.935 20.935 0 001.492 2.91 19.613 19.613 0 01-3.828 4.154.75.75 0 10.945 1.164A21.116 21.116 0 007 12.331c.095.132.192.262.29.391a.75.75 0 001.194-.91c-.094-.122-.19-.248-.287-.375A21.087 21.087 0 009.87 7.21a.75.75 0 00-1.146-.967A19.841 19.841 0 018.7 7.007a17.953 17.953 0 01.847-1.994 31.065 31.065 0 016.925.168.75.75 0 10.198-1.487 32.887 32.887 0 00-3.62-.282V2.75a.75.75 0 00-1.5 0v1.141a32.92 32.92 0 00-3.8 0V2.75zM14 11.25a.75.75 0 01.69.46l2.25 5.5a.75.75 0 01-1.38.58l-.49-1.19h-3.14l-.49 1.19a.75.75 0 01-1.38-.58l2.25-5.5a.75.75 0 01.69-.46zm-.97 3.85h1.94L14 12.85l-.97 2.25z" />
                    </svg>
                    <h3 className="font-bold text-sm">{t("speaks")}</h3>
                  </div>
                  <p className="opacity-70 text-sm">{formatLanguages(tutor.languages)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── App Screenshots with Sticky Headers ─── */}
      {(() => {
        const tVars = { firstName: localizedFirstName, language: langLabel };
        const screenshots = [
          { key: "screenshot_listen", title: t("listen", tVars) },
          { key: "screenshot_week", title: t("week", tVars) },
          { key: "screenshot_learn", title: t("learn", tVars) },
          { key: "screenshot_shadow", title: t("shadow", tVars) },
          { key: "screenshot_intro", title: t("intro", tVars) },
        ].filter((s) => tutor.metadata?.[s.key]);

        if (screenshots.length === 0) return null;

        return screenshots.map((s) => (
          <section key={s.key} className="relative">
            <StickyHeader>
              <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight">
                {s.title}
              </h2>
            </StickyHeader>
            {/* Screenshot */}
            <div className="flex justify-center px-6 pb-16 md:pb-24">
              <div className="w-full max-w-sm md:max-w-[500px] lg:max-w-[420px]">
                <img
                  src={tutor.metadata![s.key] as string}
                  alt={s.title}
                  className="w-full rounded-[2.5rem] shadow-2xl"
                />
              </div>
            </div>
          </section>
        ));
      })()}

      {/* ─── Social Links ─── */}
      {has_social && (
        <section className="px-6 py-12 md:px-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xs uppercase tracking-widest font-medium opacity-40 mb-6">
              {t("follow", { name: localizedFirstName })}
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
          {t("ready_to_learn", { name: localizedFirstName })}
        </h2>
        <p className="text-lg font-light opacity-60 mb-10 max-w-lg mx-auto">
          {tutor.short_description}
        </p>
        <a href={`/download/${slug}`} className="inline-block">
          <Image
            src="/download.svg"
            alt="Download on the App Store"
            width={170}
            height={55}
            className="hover:opacity-90 transition-opacity"
          />
        </a>
        <p className="mt-4 text-sm opacity-40">
          {t("free_to_try")}
        </p>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-8 pb-32 md:pb-8 md:px-12 flex items-center justify-between flex-wrap gap-4 border-t border-white/10">
        <div className="flex gap-6 items-center">
          <a href="/privacy" className="text-sm opacity-50 hover:opacity-70 transition-opacity">
            {t("privacy")}
          </a>
          <a href="/terms" className="text-sm opacity-50 hover:opacity-70 transition-opacity">
            {t("terms")}
          </a>
        </div>
        <p className="text-sm opacity-30">
          &copy; {new Date().getFullYear()} Candid
        </p>
      </footer>
      <MobileCTABar downloadUrl={`/download/${slug}`} ctaLabel={t("get_started")} ctaSubtext={t("no_credit_card")} />
    </main>
  );
}
