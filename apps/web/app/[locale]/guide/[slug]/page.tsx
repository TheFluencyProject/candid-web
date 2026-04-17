import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import MobileCTABar from "@/components/MobileCTABar";
import GuideNavbar from "@/components/GuideNavbar";
import QRCode from "@/components/QRCode";
import { getTutorPageConfig } from "@/config/tutors";
import StickyHeader from "@/components/StickyHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import SiteFooter from "@/components/SiteFooter";
import { localizeLanguageName, capitalize, withKoreanParticle } from "@/lib/i18n-helpers";

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
  screenshot_intro_url: string | null;
  screenshot_learn_url: string | null;
  screenshot_listen_url: string | null;
  screenshot_shadow_url: string | null;
  screenshot_week_url: string | null;
  web_bg_picture_url: string | null;
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

  let title: string;
  if (locale === "ko") {
    const koreanLang = localizeLanguageName(tutor.teaching_language, "ko");
    const koreanName = (tutor.metadata?.name_kr as string) ?? tutor.name;
    title = `Candid | ${koreanLang}, ${koreanName}과 함께`;
  } else {
    title = `Candid | ${capitalize(tutor.teaching_language)} with ${tutor.name}`;
  }
  const description = tutor.short_description;
  const ogImage = tutor.web_bg_picture_url || tutor.large_profile_picture_url;

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

  const firstName = tutor.name.split(" ")[0];
  const localizedFirstName =
    locale === "ko" && tutor.metadata?.name_kr
      ? (tutor.metadata.name_kr as string)
      : firstName;
  const langLabel = localizeLanguageName(tutor.teaching_language, locale);
  const config = getTutorPageConfig(slug);
  const rawCoolTitle =
    locale === "ko"
      ? (tutor.metadata?.cool_title_kr ?? tutor.metadata?.cool_title ?? tutor.title)
      : (tutor.metadata?.cool_title ?? tutor.title);
  const coolTitle = formatHeroTitle(rawCoolTitle);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#1F1F27", color: "#FFFFFF" }}
    >
      {/* ─── Fixed Navbar ─── */}
      <GuideNavbar sentinelId="hero-sentinel" downloadUrl={`/download/${slug}`} />

      {/* ─── Full-Viewport Hero ─── */}
      <section className="relative min-h-[80vh] lg:min-h-screen overflow-hidden">
        {/* Photo background */}
        {(tutor.web_bg_picture_url || tutor.large_profile_picture_url) ? (
          <>
            {/* Desktop photo */}
            <img
              src={tutor.web_bg_picture_url || tutor.large_profile_picture_url!}
              alt={tutor.name}
              className="absolute inset-0 w-full h-full object-cover hidden lg:block"
              style={{ objectPosition: config.photo.desktop }}
            />
            {/* Mobile photo */}
            <img
              src={tutor.web_bg_picture_url || tutor.large_profile_picture_url!}
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
              "linear-gradient(to bottom, transparent 70%, #1F1F27 100%)",
          }}
        />
        {/* Bottom fade into background color — mobile */}
        <div
          className="absolute inset-0 pointer-events-none lg:hidden"
          style={{
            background:
              "linear-gradient(to bottom, transparent 35%, rgba(31,31,39,0.4) 50%, rgba(31,31,39,0.7) 65%, rgba(31,31,39,0.85) 80%, #1F1F27 95%)",
          }}
        />

        {/* Desktop text content — left side */}
        <div className="relative z-10 hidden lg:flex flex-col justify-start min-h-screen px-12 pt-[120px] pb-24">
          <h1
            className="hero-heading text-5xl xl:text-6xl font-light leading-[1.15] mb-6 animate-fade-in-up"
            style={{ color: "#1F1F27" }}
            dangerouslySetInnerHTML={{ __html: coolTitle }}
          />
          <p
            className="text-base xl:text-lg font-light leading-relaxed mb-6 max-w-md animate-fade-in-up-delay-1"
            style={{ color: "#1F1F27", opacity: 0.7 }}
            dangerouslySetInnerHTML={{ __html: t("subtitle", { name: locale === "ko" ? withKoreanParticle(localizedFirstName) : localizedFirstName, language: langLabel }) }}
          />
          <div className="animate-fade-in-up-delay-2 self-start">
            <QRCode slug={slug} label={t("download_qr")} />
          </div>
        </div>

        {/* Mobile text content — bottom, centered */}
        <div className="relative z-10 lg:hidden flex flex-col items-center justify-end min-h-[80vh] px-6 pb-10 text-center">
          <h1
            className="hero-heading font-light leading-tight mb-4 animate-fade-in-up"
            style={{ color: "#FFFFFF", fontSize: "clamp(1.5rem, 7vw, 2.25rem)" }}
            dangerouslySetInnerHTML={{ __html: coolTitle }}
          />
          <p
            className="text-sm font-normal leading-relaxed max-w-sm animate-fade-in-up-delay-1 [&_br]:hidden"
            style={{ color: "rgba(255,255,255,0.7)" }}
            dangerouslySetInnerHTML={{ __html: t("subtitle", { name: locale === "ko" ? withKoreanParticle(localizedFirstName) : localizedFirstName, language: langLabel }) }}
          />
        </div>

        {/* "Tutor [Name]" label + arrow — desktop */}
        <div
          className="absolute z-10 hidden lg:flex flex-col items-center animate-fade-in-up-delay-3"
          style={{
            visibility: "hidden",
            top: config.arrow.desktop.top,
            left: config.arrow.desktop.left,
            transform: config.arrow.desktop.rotation
              ? `rotate(${config.arrow.desktop.rotation})`
              : undefined,
          }}
        >
          <img
            src="/curved-arrow.png"
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
            visibility: "hidden",
            top: config.arrow.mobile.top,
            right: config.arrow.mobile.right,
            transform: config.arrow.mobile.rotation
              ? `rotate(${config.arrow.mobile.rotation})`
              : undefined,
          }}
        >
          <img
            src="/curved-arrow.png"
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
      <section className="hidden px-6 pt-20 pb-12 md:px-12 md:pt-24 md:pb-16">
        <div className="max-w-sm md:max-w-[500px] lg:max-w-[420px] mx-auto">
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
          { url: tutor.screenshot_listen_url, title: t("listen", tVars) },
          { url: tutor.screenshot_week_url, title: t("week", tVars) },
          { url: tutor.screenshot_learn_url, title: t("learn", tVars) },
          { url: tutor.screenshot_shadow_url, title: t("shadow", tVars) },
          { url: tutor.screenshot_intro_url, title: t("intro", tVars) },
        ].filter((s) => s.url);

        if (screenshots.length === 0) return null;

        return screenshots.map((s) => (
          <section key={s.url} className="relative">
            <StickyHeader>
              <ScrollFadeIn>
                <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight">
                  {s.title}
                </h2>
              </ScrollFadeIn>
            </StickyHeader>
            {/* Screenshot */}
            <ScrollFadeIn>
              <div className="flex justify-center px-6 pb-16 md:pb-24">
                <div className="w-full max-w-sm md:max-w-[500px] lg:max-w-[420px]">
                  <img
                    src={s.url!}
                    alt={s.title}
                    className="w-full rounded-[2.5rem] shadow-2xl"
                  />
                </div>
              </div>
            </ScrollFadeIn>
          </section>
        ));
      })()}


      {/* ─── Footer ─── */}
      <SiteFooter />
      <MobileCTABar downloadUrl={`/download/${slug}`} ctaLabel={t("get_started")} ctaSubtext={t("no_credit_card")} />
    </main>
  );
}
