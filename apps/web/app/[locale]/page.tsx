import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import GuideNavbar from "@/components/GuideNavbar";
import MobileCTABar from "@/components/MobileCTABar";
import StickyHeader from "@/components/StickyHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import BlurImage from "@/components/BlurImage";
import HeroCarousel, { type CarouselTutor } from "@/components/HeroCarousel";
import SiteFooter from "@/components/SiteFooter";
import { getTutorPageConfig } from "@/config/tutors";
import { localizeLanguageName, withKoreanParticle, formatHeroTitle, stripEmojis } from "@/lib/i18n-helpers";

const API_BASE_URL = "https://api.joincandid.co";
// english-adam first so carousel starts with Adam
const TUTOR_SLUGS = ["english-adam", "korean-mia"];

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
  large_profile_picture_url: string | null;
  teaching_language: string;
  screenshot_community_url: string | null;
  screenshot_intro_url: string | null;
  screenshot_learn_url: string | null;
  screenshot_listen_url: string | null;
  screenshot_map_url: string | null;
  screenshot_shadow_url: string | null;
  screenshot_week_url: string | null;
  web_bg_picture_url: string | null;
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

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, guideT] = await Promise.all([
    getTranslations({ locale }),
    getTranslations({ locale, namespace: "guide" }),
  ]);

  // Fetch all tutors
  const tutors = (
    await Promise.all(TUTOR_SLUGS.map((slug) => fetchTutor(slug, locale)))
  ).filter((t): t is Tutor => t !== null);

  // Build carousel tutor data
  const carouselTutors: CarouselTutor[] = tutors
    .map((tutor) => {
      const bgImage =
        tutor.web_bg_picture_url ||
        tutor.large_profile_picture_url;
      if (!bgImage) return null;

      const config = getTutorPageConfig(tutor.slug);
      // Web-only override; falls back to cool_title (and short_description for legacy API responses) when null.
      const coolTitle = formatHeroTitle(tutor.web_title_override ?? tutor.cool_title ?? tutor.short_description);
      const firstName = tutor.name.split(" ")[0];
      const localizedFirstName =
        locale === "ko" && tutor.metadata?.name_kr
          ? (tutor.metadata.name_kr as string)
          : firstName;
      const langLabel = localizeLanguageName(tutor.teaching_language, locale);
      const nameForSubtitle = locale === "ko" ? withKoreanParticle(localizedFirstName) : localizedFirstName;
      // Per-tutor English subtitle override; Korean keeps the i18n default.
      const enOverride = locale === "en" ? config.subtitle?.en : undefined;
      const subtitle: string = enOverride ?? stripEmojis(guideT("subtitle", { name: nameForSubtitle, language: langLabel }));

      const item: CarouselTutor = {
        slug: tutor.slug,
        firstName,
        city: tutor.city,
        language: langLabel,
        bgImage,
        coolTitle,
        subtitle,
        photoPosition: config.photo,
        arrowPosition: config.arrow,
        hero: config.hero,
      };
      return item;
    })
    .filter((t): t is CarouselTutor => t !== null);

  // Build screenshot sections by alternating tutors. Sections without a screenshot are dropped.
  const screenshotSectionKeys = [
    "screenshot_listen_url",
    "screenshot_week_url",
    "screenshot_map_url",
    "screenshot_community_url",
    "screenshot_intro_url",
  ] as const;

  const sectionsWithTutors = screenshotSectionKeys
    .map((key, i) => {
      // Prefer the alternation pick; if that tutor doesn't have this screenshot, use any tutor that does.
      const preferred = tutors[i % tutors.length];
      const tutor = preferred?.[key] ? preferred : tutors.find((t) => t?.[key]);
      const url = tutor?.[key];
      if (!tutor || !url) return null;
      const titleMap = {
        screenshot_listen_url: guideT("home_listen"),
        screenshot_week_url: guideT("week"),
        screenshot_map_url: guideT("home_map"),
        screenshot_intro_url: guideT("intro"),
        screenshot_community_url: guideT("community"),
      };
      return {
        key,
        title: titleMap[key],
        screenshotUrl: url,
        tutorName: tutor.name.split(" ")[0],
      };
    })
    .filter(Boolean) as Array<{
    key: string;
    title: string;
    screenshotUrl: string;
    tutorName: string;
  }>;

  return (
    <main
      className="min-h-screen text-white"
      style={{ backgroundColor: "#18181C" }}
    >
      <GuideNavbar
        sentinelId="hero-sentinel"
        downloadUrl="/download"
        alwaysWhite
        rightElement={
          <>
            {/* Desktop: Get the app pill */}
            <a
              href="/download"
              className="hidden lg:block px-5 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#FFFFFF", color: "#18181C" }}
            >
              Get the app
            </a>
            {/* Mobile: App Store badge */}
            <a href="/download" className="lg:hidden">
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

      {/* ─── Hero Carousel ─── */}
      <HeroCarousel tutors={carouselTutors} />

      {/* ─── Screenshot Sections ─── */}
      {sectionsWithTutors.map((s) => (
        <section key={s.key} className="relative">
          <StickyHeader>
            <ScrollFadeIn>
              <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight">
                {s.title}
              </h2>
            </ScrollFadeIn>
          </StickyHeader>
          <div className="flex justify-center px-6 pb-24 md:pb-32">
            <div className="w-full max-w-sm md:max-w-[500px] lg:max-w-[420px]">
              {/* BlurImage = own intersection observer + opacity/blur transition,
                  decoupled from any sibling fade so the image's animation always
                  anchors to its own viewport rect. */}
              <BlurImage
                src={s.screenshotUrl}
                alt={s.title}
                className="w-full rounded-[2.5rem] shadow-2xl"
              />
            </div>
          </div>
        </section>
      ))}

      {/* ─── Footer ─── */}
      <SiteFooter />
      <MobileCTABar hideUntilScroll />
    </main>
  );
}
