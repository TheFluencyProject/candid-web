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
import { localizeLanguageName, capitalize, withKoreanParticle, formatHeroTitle } from "@/lib/i18n-helpers";

const API_BASE_URL = "https://dev.api.joincandid.co";
const APP_STORE_URL = "https://apps.apple.com/app/id6754859158";

interface TutorLanguageProficiency {
  language: string;
  level: string;
}

interface TutorMetadata {
  name_kr?: string;
  [key: string]: unknown;
}

interface Tutor {
  slug: string;
  name: string;
  title: string;
  // Backend field during iOS transition: dev-deployed API may still return only short_description.
  cool_title?: string;
  short_description?: string;
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
  // Flatten the \n in cool_title for HTML meta description (single-line expected).
  const description = (tutor.cool_title ?? tutor.short_description ?? "").replace(/\n/g, " ");
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
  const coolTitle = formatHeroTitle(tutor.cool_title ?? tutor.short_description);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
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
              "linear-gradient(to bottom, transparent 70%, #18181C 100%)",
          }}
        />
        {/* Bottom fade into background color — mobile */}
        <div
          className="absolute inset-0 pointer-events-none lg:hidden"
          style={{
            background:
              "linear-gradient(to bottom, transparent 35%, rgba(24,24,28,0.4) 50%, rgba(24,24,28,0.7) 65%, rgba(24,24,28,0.85) 80%, #18181C 95%)",
          }}
        />

        {/* Desktop text content — left side */}
        <div className="relative z-10 hidden lg:flex flex-col justify-start min-h-screen px-12 pt-[120px] pb-24">
          <h1
            className="hero-heading text-5xl xl:text-6xl font-light leading-[1.15] mb-6 animate-fade-in-up"
            style={{ color: "#18181C" }}
            dangerouslySetInnerHTML={{ __html: coolTitle }}
          />
          <p
            className="text-base xl:text-lg font-light leading-relaxed mb-6 max-w-md animate-fade-in-up-delay-1"
            style={{ color: "#18181C", opacity: 0.7 }}
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


      {/* ─── App Screenshots with Sticky Headers ─── */}
      {(() => {
        const tVars = { firstName: localizedFirstName, language: langLabel };
        const screenshots = [
          { url: tutor.screenshot_listen_url, title: t("listen", tVars) },
          { url: tutor.screenshot_week_url, title: t("week", tVars) },
          { url: tutor.screenshot_shadow_url, title: t("shadow", tVars) },
          { url: tutor.screenshot_intro_url, title: t("intro", tVars) },
        ].filter((s) => s.url);

        if (screenshots.length === 0) return null;

        return (
          <div className="pt-20 md:pt-28 lg:pt-32">
          {screenshots.map((s) => (
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
        ))}
          </div>
        );
      })()}


      {/* ─── Footer ─── */}
      <SiteFooter />
      <MobileCTABar downloadUrl={`/download/${slug}`} ctaLabel={t("get_started")} ctaSubtext={t("no_credit_card")} />
    </main>
  );
}
