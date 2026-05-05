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
import BlurImage from "@/components/BlurImage";
import SiteFooter from "@/components/SiteFooter";
import { localizeLanguageName, localizeMapCountry, capitalize, withKoreanParticle, formatHeroTitle, stripEmojis } from "@/lib/i18n-helpers";

const API_BASE_URL = "https://api.joincandid.co";
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
  // Optional web-only override; falls back to cool_title when null.
  web_title_override?: string | null;
  short_description?: string;
  city: string | null;
  birthday: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  profile_picture_url: string | null;
  large_profile_picture_url: string | null;
  intro_video_url: string | null;
  screenshot_community_url: string | null;
  screenshot_intro_url: string | null;
  screenshot_learn_url: string | null;
  screenshot_listen_url: string | null;
  screenshot_map_url: string | null;
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

  // Format: "<TITLE> - <Language> with <Name>" so each tutor's tab reads like
  // their program ("AMERICAN DREAM - English with Adam"). Falls back to the
  // legacy "Candid | …" form when title is empty.
  let title: string;
  if (locale === "ko") {
    const koreanLang = localizeLanguageName(tutor.teaching_language, "ko");
    const koreanName = (tutor.metadata?.name_kr as string) ?? tutor.name;
    const suffix = `${koreanLang}, ${withKoreanParticle(koreanName)} 함께`;
    title = tutor.title ? `${tutor.title} - ${suffix}` : `Candid | ${suffix}`;
  } else {
    const suffix = `${capitalize(tutor.teaching_language)} with ${tutor.name}`;
    title = tutor.title ? `${tutor.title} - ${suffix}` : `Candid | ${suffix}`;
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
  // Web-only override; falls back to cool_title (and short_description for legacy API responses) when null.
  const coolTitle = formatHeroTitle(tutor.web_title_override ?? tutor.cool_title ?? tutor.short_description);
  // Per-tutor English subtitle override (HTML allowed). Korean keeps the i18n default.
  const subtitleHtml = locale === "en" && config.subtitle?.en
    ? config.subtitle.en
    : stripEmojis(t("subtitle", { name: locale === "ko" ? withKoreanParticle(localizedFirstName) : localizedFirstName, language: langLabel }));

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
    >
      {/* ─── Fixed Navbar ─── */}
      <GuideNavbar
        sentinelId="hero-sentinel"
        downloadUrl={`/download/${slug}`}
        alwaysWhite={Boolean(config.hero?.textColor)}
        rightElement={
          <>
            {/* Desktop: Get the app pill (App Store badge moves inline under hero) */}
            <a
              href={`/download/${slug}`}
              className="hidden lg:block px-5 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#FFFFFF", color: "#18181C" }}
            >
              Get the app
            </a>
            {/* Mobile: App Store badge */}
            <a href={`/download/${slug}`} className="lg:hidden">
              <Image
                src="/download.svg"
                alt="Download on the App Store"
                width={120}
                height={40}
                priority
              />
            </a>
          </>
        }
      />

      {/* ─── Full-Viewport Hero ─── */}
      <section className="relative min-h-[80vh] lg:min-h-screen overflow-hidden">
        {/* Photo background */}
        {(tutor.web_bg_picture_url || tutor.large_profile_picture_url) ? (
          <>
            {/* Desktop photo. Plain <img> direct from S3 — bypasses /_next/image transcode hop. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tutor.web_bg_picture_url || tutor.large_profile_picture_url!}
              alt={tutor.name}
              className="absolute inset-0 w-full h-full object-cover hidden lg:block"
              style={{ objectPosition: config.photo.desktop }}
            />
            {/* Mobile photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tutor.web_bg_picture_url || tutor.large_profile_picture_url!}
              alt={tutor.name}
              className="absolute inset-0 w-full h-full object-cover lg:hidden origin-bottom"
              style={{
                objectPosition: config.photo.mobile,
                transform: `scale(${config.photo.mobileScale ?? 1.15}) translate(${config.photo.mobileTranslateX ?? '0'}, ${config.photo.mobileTranslateY ?? '0'})`,
              }}
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

        {/* Optional per-tutor overlay (e.g. dark radial behind the headline).
            Only rendered when the hero text is white — the overlay's whole
            purpose is to keep white text legible on a busy/light photo. */}
        {config.hero?.textColor && config.hero?.overlay && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: config.hero.overlay }}
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
              "linear-gradient(to bottom, transparent 45%, rgba(24,24,28,0.4) 60%, rgba(24,24,28,0.7) 75%, rgba(24,24,28,0.85) 90%, #18181C 100%)",
          }}
        />

        {/* Desktop text content — left side. Bumped weight on desktop when the
            hero text override is white so it stays readable on busy backgrounds. */}
        <div className="relative z-10 hidden lg:flex flex-col justify-start min-h-screen px-12 pt-[100px] pb-24">
          <h1
            className={`hero-heading ${config.hero?.textShadow ? "hero-heading--shadowed" : ""} text-5xl xl:text-6xl font-light lg:font-medium leading-[1.15] mb-6 animate-fade-in-up`}
            style={{ color: config.hero?.textColor ?? "#18181C", textShadow: config.hero?.textShadow }}
            dangerouslySetInnerHTML={{ __html: coolTitle }}
          />
          <p
            className={`text-[1.25rem] xl:text-[1.40625rem] font-light leading-snug mb-5 animate-fade-in-up-delay-1`}
            style={{ color: config.hero?.textColor ?? "#18181C", textShadow: config.hero?.textShadow }}
            dangerouslySetInnerHTML={{ __html: subtitleHtml }}
          />
          <a
            href={`/download/${slug}`}
            className="animate-fade-in-up-delay-2 self-start"
          >
            <Image
              src="/download.svg"
              alt="Download on the App Store"
              width={140}
              height={46}
              priority
            />
          </a>
          {/* Hidden until further notice; superseded by inline App Store badge above. */}
          <div className="hidden">
            <QRCode slug={slug} label={t("download_qr")} />
          </div>
        </div>

        {/* Mobile text content — bottom, centered. Slim bottom padding so the
            headline sits ~10% lower in the hero. */}
        <div className="relative z-10 lg:hidden flex flex-col items-center justify-end min-h-[80vh] px-6 pb-[3svh] text-center">
          <h1
            className="hero-heading font-light leading-tight mb-4 animate-fade-in-up"
            style={{ color: "#FFFFFF", fontSize: "clamp(1.65rem, 7.7vw, 2.75rem)", textShadow: config.hero?.textShadow }}
            dangerouslySetInnerHTML={{ __html: coolTitle }}
          />
          <p
            className="text-[1.05rem] font-normal leading-relaxed max-w-sm animate-fade-in-up-delay-1"
            style={{ color: "#FFFFFF", textShadow: config.hero?.textShadow }}
            dangerouslySetInnerHTML={{ __html: subtitleHtml }}
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
          <Image
            src="/curved-arrow.png"
            alt=""
            width={48}
            height={48}
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
          <Image
            src="/curved-arrow.png"
            alt=""
            width={36}
            height={36}
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
        const country = localizeMapCountry(tutor.teaching_language, locale);
        const screenshots = [
          { url: tutor.screenshot_listen_url, title: t("listen", tVars) },
          { url: tutor.screenshot_map_url, title: t("map", { firstName: localizedFirstName, country }) },
          { url: tutor.screenshot_shadow_url, title: t("shadow", tVars) },
          { url: tutor.screenshot_week_url, title: t("week", tVars) },
          { url: tutor.screenshot_community_url, title: t("community") },
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
            {/* Screenshot — BlurImage anchors its fade/unblur to its own
                viewport rect so the animation feels right regardless of where
                the sibling sticky header is. */}
            <div className="flex justify-center px-6 pb-16 md:pb-24">
              <div className="w-full max-w-sm md:max-w-[500px] lg:max-w-[420px]">
                <BlurImage
                  src={s.url!}
                  alt={s.title}
                  className="w-full rounded-[2.5rem] shadow-2xl"
                />
              </div>
            </div>
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
