import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import GuideNavbar from "@/components/GuideNavbar";
import MobileCTABar from "@/components/MobileCTABar";
import StickyHeader from "@/components/StickyHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import HeroCarousel, { type CarouselTutor } from "@/components/HeroCarousel";
import SiteFooter from "@/components/SiteFooter";
import { getTutorPageConfig } from "@/config/tutors";

const API_BASE_URL = "https://dev.api.joincandid.co";
// english-adam first so carousel starts with Adam
const TUTOR_SLUGS = ["english-adam", "korean-mia"];

interface TutorMetadata {
  cool_title?: string;
  cool_title_kr?: string;
  [key: string]: unknown;
}

interface Tutor {
  slug: string;
  name: string;
  title: string;
  short_description: string;
  city: string | null;
  large_profile_picture_url: string | null;
  teaching_language: string;
  screenshot_intro_url: string | null;
  screenshot_learn_url: string | null;
  screenshot_listen_url: string | null;
  screenshot_shadow_url: string | null;
  screenshot_week_url: string | null;
  web_bg_picture_url: string | null;
  metadata: TutorMetadata | null;
}

function formatHeroTitle(text: string): string {
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
      const rawCoolTitle =
        locale === "ko"
          ? (tutor.metadata?.cool_title_kr ?? tutor.metadata?.cool_title ?? tutor.title)
          : (tutor.metadata?.cool_title ?? tutor.title);
      const coolTitle = formatHeroTitle(rawCoolTitle);
      const firstName = tutor.name.split(" ")[0];
      const langLabel = tutor.teaching_language.charAt(0).toUpperCase() + tutor.teaching_language.slice(1);
      const subtitle = guideT("subtitle", { name: firstName, language: langLabel });

      return {
        slug: tutor.slug,
        firstName,
        city: tutor.city,
        language: langLabel,
        bgImage,
        coolTitle,
        subtitle,
        photoPosition: config.photo,
        arrowPosition: config.arrow,
      };
    })
    .filter((t): t is CarouselTutor => t !== null);

  // Build screenshot sections by alternating tutors
  const screenshotSections = [
    { key: "screenshot_listen_url", title: "Learn the language through their eyes" },
    { key: "screenshot_week_url", title: "New lessons every week" },
    { key: "screenshot_learn_url", title: "Learn how natives actually talk" },
    { key: "screenshot_shadow_url", title: "Practice speaking just like they do" },
    { key: "screenshot_intro_url", title: "Get tutored through it all" },
  ] as const;

  const sectionsWithTutors = screenshotSections
    .map((section, i) => {
      const tutor = tutors[i % tutors.length];
      const url = tutor?.[section.key];
      if (!url) return null;
      return {
        key: section.key,
        title: section.title,
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
      style={{ backgroundColor: "#131212" }}
    >
      <GuideNavbar
        sentinelId="hero-sentinel"
        downloadUrl="/download"
        alwaysWhite
        rightElement={
          <>
            {/* Desktop: Find your tutor pill */}
            <span
              className="hidden lg:block px-5 py-2 rounded-full text-sm font-semibold cursor-default"
              style={{ backgroundColor: "#FFFFFF", color: "#131212" }}
            >
              Get the app
            </span>
            {/* Mobile: App Store badge — disabled */}
            <span className="lg:hidden cursor-default">
              <Image
                src="/download.svg"
                alt="Download on the App Store"
                width={120}
                height={40}
                priority
              />
            </span>
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
          <ScrollFadeIn>
            <div className="flex justify-center px-6 pb-24 md:pb-32">
              <div className="w-full max-w-sm md:max-w-[500px] lg:max-w-[420px]">
                <img
                  src={s.screenshotUrl}
                  alt={s.title}
                  className="w-full rounded-[2.5rem] shadow-2xl"
                />
              </div>
            </div>
          </ScrollFadeIn>
        </section>
      ))}

      {/* ─── Footer ─── */}
      <SiteFooter privacyLabel={t("footer.privacy")} termsLabel={t("footer.terms")} />
      <MobileCTABar hideUntilScroll />
    </main>
  );
}
