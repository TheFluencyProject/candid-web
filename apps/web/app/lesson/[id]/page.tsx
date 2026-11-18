import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import DownloadQRInterceptor from "@/components/DownloadQRInterceptor";
import DesktopCTA from "@/components/DesktopCTA";
import FlagExposure from "@/components/FlagExposure";
import LandingSections from "@/components/LandingSections";
import LessonPagePath, { type LessonPathCopy } from "@/components/LessonPagePath";
import LessonThumb from "@/components/LessonThumb";
import ScrollNav from "@/components/ScrollNav";
import { fetchLessonMeta, fetchLessonPath, fetchTutor, type LessonMeta } from "@/lib/api";
import { pickLocale } from "@/lib/i18n-helpers";
import { getDesktopCtaVariant, getDistinctId, getLessonPageFlags, previewArm } from "@/lib/posthog-server";
import { DESKTOP_CTA_ARMS, LESSON_HERO_ARMS, LESSON_HERO_FLAG_KEY, LESSON_SECTIONS_ARMS, LESSON_SECTIONS_FLAG_KEY } from "@/lib/posthog-config";
import type { Locale } from "@/i18n/routing";
// import { localizeLanguageName } from "@/lib/i18n-helpers";

const SHARE_DESCRIPTIONS: Record<Locale, string> = {
  en: "Candid is your guide to real, spoken language through a tutor's real life in the country.",
  ko: "Candid는 나만의 튜터가 보여주는 실생활 영어 프로그램입니다.",
  ja: "Candidは、現地で暮らすチューターのリアルな日常を通して、生きた話し言葉を学べるガイドです。",
  zh: "Candid 带你通过当地导师的真实生活，学习真实的口语。",
  "zh-Hant": "Candid 帶你透過當地導師的真實生活，學習道地的口說。",
  es: "Candid es tu guía al idioma real y hablado a través de la vida real de un tutor en su país.",
  ru: "Candid — ваш проводник в живой разговорный язык через реальную жизнь преподавателя в его стране.",
  fr: "Candid est ton guide vers la vraie langue parlée, à travers la vie réelle d’un tuteur dans son pays.",
  vi: "Candid giúp bạn học ngôn ngữ nói thực tế qua cuộc sống thật của gia sư tại đất nước của họ.",
  th: "Candid คือไกด์ที่พาคุณเรียนภาษาพูดจริงผ่านชีวิตจริงของติวเตอร์ในประเทศของเขา",
  id: "Candid adalah panduanmu menuju bahasa lisan yang nyata lewat kehidupan nyata seorang tutor di negaranya.",
  de: "Candid ist dein Weg zur echten, gesprochenen Sprache – durch das echte Leben eines Tutors in seinem Land.",
  it: "Candid è la tua guida alla lingua parlata vera, attraverso la vita reale di un tutor nel suo paese.",
};

// This route lives OUTSIDE the [locale] group (excluded from the next-intl matcher),
// so there's no translation context here — keep the little UI copy in a local map.
// scanLabel/inlineLabel are the desktop-cta-qr morph/inline arms' copy; that test is en only, so other locales fall back to en.
const COPY: Record<Locale, { cta: (name: string) => string; qrTitle: string; scanLabel?: string; inlineLabel?: string; privacy: string; terms: string }> = {
  en: { cta: (name) => `Study with ${name}`, qrTitle: "Download Candid for iOS", scanLabel: "SCAN TO GET STARTED", inlineLabel: "Scan to study for free", privacy: "Privacy", terms: "Terms" },
  ko: { cta: (name) => `${name}와 공부하기`, qrTitle: "iOS용 Candid 다운로드", privacy: "개인정보", terms: "이용약관" },
  ja: { cta: (name) => `${name}と勉強する`, qrTitle: "iOS版Candidをダウンロード", privacy: "プライバシー", terms: "利用規約" },
  zh: { cta: (name) => `和${name}一起学习`, qrTitle: "下载 iOS 版 Candid", privacy: "隐私", terms: "条款" },
  "zh-Hant": { cta: (name) => `和${name}一起學習`, qrTitle: "下載 iOS 版 Candid", privacy: "隱私權", terms: "條款" },
  es: { cta: (name) => `Estudia con ${name}`, qrTitle: "Descarga Candid para iOS", privacy: "Privacidad", terms: "Términos" },
  ru: { cta: (name) => `Учиться с ${name}`, qrTitle: "Скачать Candid для iOS", privacy: "Конфиденциальность", terms: "Условия" },
  fr: { cta: (name) => `Étudie avec ${name}`, qrTitle: "Télécharge Candid pour iOS", privacy: "Confidentialité", terms: "Conditions" },
  vi: { cta: (name) => `Học cùng ${name}`, qrTitle: "Tải Candid cho iOS", privacy: "Quyền riêng tư", terms: "Điều khoản" },
  th: { cta: (name) => `เรียนกับ ${name}`, qrTitle: "ดาวน์โหลด Candid สำหรับ iOS", privacy: "ความเป็นส่วนตัว", terms: "ข้อกำหนด" },
  id: { cta: (name) => `Belajar bareng ${name}`, qrTitle: "Unduh Candid untuk iOS", privacy: "Privasi", terms: "Ketentuan" },
  de: { cta: (name) => `Lerne mit ${name}`, qrTitle: "Candid für iOS laden", privacy: "Datenschutz", terms: "Bedingungen" },
  it: { cta: (name) => `Studia con ${name}`, qrTitle: "Scarica Candid per iOS", privacy: "Privacy", terms: "Termini" },
};

// Band labels match the app's Answers.xcstrings wording, in every site locale.
const BAND_LABELS: Record<Locale, Record<string, string>> = {
  en: { beginner: "Beginner", upper_beginner: "Upper Beginner", lower_intermediate: "Lower Intermediate", intermediate: "Intermediate" },
  ko: { beginner: "초급", upper_beginner: "초중급", lower_intermediate: "중하급", intermediate: "중급" },
  ja: { beginner: "初級", upper_beginner: "初級の上", lower_intermediate: "中級の下", intermediate: "中級" },
  zh: { beginner: "初级", upper_beginner: "初级偏上", lower_intermediate: "中级偏下", intermediate: "中级" },
  "zh-Hant": { beginner: "初級", upper_beginner: "初級偏上", lower_intermediate: "中級偏下", intermediate: "中級" },
  es: { beginner: "Principiante", upper_beginner: "Principiante alto", lower_intermediate: "Intermedio bajo", intermediate: "Intermedio" },
  ru: { beginner: "Начальный", upper_beginner: "Продвинутый начинающий", lower_intermediate: "Ниже среднего", intermediate: "Средний" },
  fr: { beginner: "Débutant", upper_beginner: "Débutant avancé", lower_intermediate: "Intermédiaire inférieur", intermediate: "Intermédiaire" },
  vi: { beginner: "Sơ cấp", upper_beginner: "Sơ cấp cao", lower_intermediate: "Trung cấp thấp", intermediate: "Trung cấp" },
  th: { beginner: "ระดับต้น", upper_beginner: "ระดับต้นสูง", lower_intermediate: "ระดับกลางต้น", intermediate: "ระดับกลาง" },
  id: { beginner: "Pemula", upper_beginner: "Pemula atas", lower_intermediate: "Menengah bawah", intermediate: "Menengah" },
  de: { beginner: "Anfänger", upper_beginner: "Fortgeschrittener Anfänger", lower_intermediate: "Untere Mittelstufe", intermediate: "Mittelstufe" },
  it: { beginner: "Principiante", upper_beginner: "Principiante avanzato", lower_intermediate: "Intermedio basso", intermediate: "Intermedio" },
};

// The path arm's hero Study button; LessonPagePath's phone bar shows once it scrolls away.
const HERO_CTA_ID = "lesson-hero-cta";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const locale = pickLocale(headersList.get("accept-language"));
  // This route is outside [locale], so next-intl has no request locale: set it, or the home sections
  // below (getTranslations("home")) would all render in English.
  setRequestLocale(locale);

  const lesson = await fetchLessonMeta(id, locale);
  if (!lesson) notFound();

  const [tutor, path] = await Promise.all([
    // Tutor branding is best-effort: a hiccup fetching the tutor must not crash the
    // lesson page, so fall back to no-branding (null) rather than letting fetchTutor throw.
    lesson.tutor_slug ? fetchTutor(lesson.tutor_slug, locale).catch(() => null) : null,
    // Fetched in both hero arms (never throws; null = no path), so the hero test only counts lessons that have one.
    fetchLessonPath(lesson.lesson_id, locale),
  ]);

  const copy = COPY[locale];
  // desktop-cta-qr arm: the same cached evaluation AnonAnalytics bootstraps (en only).
  const distinctId = await getDistinctId();
  const query = await searchParams;
  const desktopCtaVariant =
    previewArm(query.cta, DESKTOP_CTA_ARMS) ??
    (locale === "en" ? await getDesktopCtaVariant(distinctId) : undefined);
  // lesson-page-sections + lesson-page-hero arms (every locale): the same cached evaluation AnonAnalytics bootstraps.
  const lessonFlags = await getLessonPageFlags(distinctId);
  const sectionsVariant = previewArm(query.sections, LESSON_SECTIONS_ARMS) ?? lessonFlags.sections;
  const heroVariant = previewArm(query.hero, LESSON_HERO_ARMS) ?? lessonFlags.hero;
  // Path arm only when there's a path (fetch failed / route not live yet / no units → today's hero, and no
  // hero exposure below, so the test only counts visitors who saw their arm).
  const pathArm = heroVariant === "path" ? path : null;
  // The lesson's accent drives the path and its Study buttons (black text, like home's lit coins); the site's mint without one.
  const accent = lesson.accent_color || "#89FFB4";
  const pathCopy = pathArm ? ((await getMessages()).lesson_path as LessonPathCopy) : null;
  const downloadHref = `/download/${lesson.tutor_slug}?l=${lesson.lesson_id}`;
  const ctaLabel = copy.cta(lesson.tutor_name || "Candid");
  const tHome = sectionsVariant === "sections" ? await getTranslations("home") : null;
  // Tutor row ("Grace · Lower Intermediate"), every width.
  const bandLabel = lesson.difficulty_band ? BAND_LABELS[locale][lesson.difficulty_band] ?? null : null;
  const tutorPhoto = tutor?.large_profile_picture_url ?? tutor?.profile_picture_url ?? null;

  // Level subtitle ("Upper Beginner Korean") hidden for now — see the JSX below.
  // const languageLabel = localizeLanguageName(lesson.teaching_language, locale);
  // const bandLabel = lesson.difficulty_band ? BAND_LABELS[locale][lesson.difficulty_band] : null;
  // const levelSubtitle = bandLabel ? `${bandLabel} ${languageLabel}` : languageLabel;

  const tutorRow = (className: string) => (
    <div className={`${className} inline-flex items-center gap-3`}>
      {tutorPhoto && (
        // Plain <img> direct from S3 — bypasses the /_next/image transcode hop.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tutorPhoto} alt={lesson.tutor_name} className="w-7 h-7 rounded-full object-cover" />
      )}
      <span className="text-base font-medium lg:font-normal">
        {lesson.tutor_name}
        {bandLabel && ` · ${bandLabel}`}
      </span>
    </div>
  );

  // /download/{slug} = this tutor's App Store link. On desktop the interceptor below
  // swallows the click and pops a QR of the equivalent /qr/{slug} link (same
  // destination, but scannable without tripping the App Clip card); mobile navigates
  // normally. Either way the click is tracked as study_cta_clicked.
  const studyCta = (
    <DesktopCTA
      href={downloadHref}
      label={ctaLabel}
      scanLabel={copy.scanLabel ?? COPY.en.scanLabel!}
      inlineLabel={copy.inlineLabel ?? COPY.en.inlineLabel!}
      tutorSlug={lesson.tutor_slug}
      lessonId={lesson.lesson_id}
      surface="lesson"
      variant={desktopCtaVariant}
      distinctId={distinctId}
      color={pathArm ? accent : undefined}
    />
  );

  return (
    <main data-tutor-slug={lesson.tutor_slug} className="flex flex-col" style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}>
      {pathArm && pathCopy ? (
        // lesson-page-hero = path: the pinned top bar; desktop = thumbnail, title, tutor row and button pinned in a
        // centered left column beside the lesson's whole path; phones = the same first screen, the path below it.
        <>
          <ScrollNav />
          <div className="pt-[61px] px-4 lg:px-10 lg:grid lg:grid-cols-[minmax(360px,440px)_minmax(480px,600px)] lg:justify-center lg:gap-[72px]">
            <aside>
              <div className="flex flex-col items-center text-center pt-3 pb-2 lg:sticky lg:top-[61px] lg:min-h-[calc(100svh-61px)] lg:justify-center lg:pt-4 lg:pb-12">
                {/* lg+: the title, tutor row and button sit under the frame, so they come off its height too. */}
                <LessonThumb lesson={lesson} lgMaxPx={360} lgReservedPx={360} />
                <h1 className="mt-5 lg:mt-6 text-2xl md:text-3xl font-semibold max-w-xl lg:max-w-md leading-snug">
                  {lesson.localized_title}
                </h1>
                {tutorRow("mt-3")}
                <div id={HERO_CTA_ID} className="mt-5 lg:mt-7">
                  {studyCta}
                </div>
              </div>
            </aside>
            <LessonPagePath path={pathArm} accent={accent} copy={pathCopy} ctaLabel={ctaLabel} ctaHref={downloadHref} heroCtaId={HERO_CTA_ID} />
          </div>
        </>
      ) : (
        // One viewport tall, so the CTA is always reachable without scrolling and the footer
        // still starts below the fold. svh, not vh — vh on mobile Safari is the URL-bar-hidden
        // viewport, which is what pushed the CTA off screen.
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

          <section className="flex-1 flex flex-col lg:flex-row items-center justify-center lg:gap-14 px-5 py-4 text-center">
            {/* lg+: title/tutor/CTA sit beside the frame, so only the header and padding come off the height. */}
            <LessonThumb lesson={lesson} lgMaxPx={440} lgReservedPx={160} />

            {/* lg+: beside the frame, left-aligned. */}
            <div className="flex flex-col items-center lg:items-start lg:text-left">
            <h1 className="mt-5 lg:mt-3 text-2xl md:text-3xl font-semibold max-w-xl lg:max-w-md leading-snug">
              {lesson.localized_title}
            </h1>
            {/* Hidden for now. Title → tutor row falls back to mt-6, the same layout this had
                whenever the old category subtitle was null. */}
            {/* <p className="mt-2 text-base md:text-lg font-light" style={{ color: "rgba(255,255,255,0.6)" }}>
              {levelSubtitle}
            </p> */}

            {/* lg+: above the title. */}
            {tutorRow("mt-4 lg:mt-0 lg:order-first")}

            <div className="mt-5 lg:mt-10">{studyCta}</div>
            </div>
          </section>
        </div>
      )}
      <DownloadQRInterceptor label={copy.qrTitle} />

      {/* lesson-page-sections test arm: the home page's sections under the first screen, so the heading
          only shows once the visitor scrolls. Their buttons keep this lesson's download link. */}
      {tHome && (
        <>
          {/* Options 6 + 9 combined (Adam 11/17): the caps label in an outlined pill sitting on a gray hairline; below the
              line the page starts a lighter gray and fades back to the page color over the first section (about a screen). */}
          <div
            id="how-it-works"
            className="mt-16 border-t border-[#4B4B50]"
            style={{ background: "linear-gradient(#202026, #18181C 100svh) no-repeat, #18181C" }}
          >
            <div className="-mt-[17px] flex justify-center px-6 pb-10">
              <h2
                className={`rounded-full border border-[#4B4B50] px-4 py-2 text-[12px] leading-4 font-bold uppercase whitespace-nowrap ${locale === "ko" ? "" : "tracking-[0.14em]"}`}
                style={{ backgroundColor: "#202026" }}
              >
                {tHome("how_it_works")}
              </h2>
            </div>
            <LandingSections locale={locale} ctaHref={downloadHref} />
          </div>
        </>
      )}
      <FlagExposure flag={LESSON_SECTIONS_FLAG_KEY} variant={sectionsVariant} />
      <FlagExposure flag={LESSON_HERO_FLAG_KEY} variant={path ? heroVariant : undefined} />

      {/* Path arm, phones: room for the floating Study bar under the last line. */}
      <footer
        className={`px-5 pt-6 flex items-center justify-between flex-wrap gap-4 text-sm ${pathArm ? "pb-[120px] lg:pb-6" : "pb-6"}`}
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
