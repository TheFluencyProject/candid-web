import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import MobileCTABar from "@/components/MobileCTABar";
import TutorNavbar from "@/components/TutorNavbar";
import QRCode from "@/components/QRCode";
import { getTutorPageConfig } from "@/config/tutors";
import StickyHeader from "@/components/StickyHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import BlurImage from "@/components/BlurImage";
import SiteFooter from "@/components/SiteFooter";
import JoinForFreePill from "@/components/JoinForFree/JoinForFreePill";
import JoinForFreeSheet from "@/components/JoinForFree/JoinForFreeSheet";
import MarketingClipMarquee from "@/components/MarketingClipMarquee";
import { localizeLanguageName, localizeMapCountry, capitalize, withKoreanParticle, formatHeroTitle, stripEmojis } from "@/lib/i18n-helpers";
import { type Tutor, type TutorLanguageProficiency, type MarketingClip, fetchTutor, fetchMarketingClips } from "@/lib/api";
import { isJoinForFreeContext, isCandidtutorsHost } from "@/lib/canonical-hosts";

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
  // ?v=meta toggles the Meta-ad landing variant (different headline + CTA).
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

export default async function TutorPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [tutor, t, t_footer, host_header, sp] = await Promise.all([
    fetchTutor(slug, locale),
    getTranslations("tutor"),
    getTranslations("footer"),
    headers().then(h => h.get("host") ?? ""),
    searchParams,
  ]);
  if (!tutor) {
    notFound();
  }

  // Three CTA modes by host:
  //  - candidtutors  → "Find your tutor" (App Store) + "Become a Candid Tutor" secondary
  //  - join_for_free → bottom-sheet web signup (per-tutor custom_domain only)
  //  - default       → existing "Get the app" / App Store badge (joincandid.co + previews)
  const candidtutors_brand = isCandidtutorsHost(host_header);
  const join_for_free = isJoinForFreeContext(host_header);
  const join_for_free_locale: "en" | "ko" = locale === "ko" ? "ko" : "en";

  // Meta-ad landing variant: ?v=meta swaps hero copy + CTA, always-shows mobile sticky.
  const is_meta_variant = sp.v === "meta";

  // CTAs that open the Join-for-free sheet (instead of routing to the App Store):
  // custom_domain tutor pages AND every candidtutors.co tutor page (both default
  // and ?v=meta). joincandid.co/tutor stays on the App Store path.
  const uses_join_sheet = join_for_free || candidtutors_brand;

  // "Join {name}'s study club for conversational {lang}" framing — default on
  // candidtutors.co AND on the ?v=meta ad variant; original subtitle otherwise.
  const use_study_club_framing = is_meta_variant || candidtutors_brand;

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
  const defaultSubtitleHtml = locale === "en" && config.subtitle?.en
    ? config.subtitle.en
    : stripEmojis(t("subtitle", { name: locale === "ko" ? withKoreanParticle(localizedFirstName) : localizedFirstName, language: langLabel }));
  // Meta variant subtitle uses the same i18n key on both desktop + mobile (no per-tutor override).
  const metaSubtitleHtml = stripEmojis(t("meta_subtitle", {
    name: locale === "ko" ? withKoreanParticle(localizedFirstName) : localizedFirstName,
    language: langLabel,
  }));
  const subtitleHtml = use_study_club_framing ? metaSubtitleHtml : defaultSubtitleHtml;
  const subtitleMobileHtml = use_study_club_framing
    ? metaSubtitleHtml.replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim()
    : (locale === "en" && config.subtitle?.enMobile
        ? config.subtitle.enMobile
        : subtitleHtml.replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim());

  // ─── candidtutors.co simplified card layout ─────────────────────────────
  // Single centered card on the dark page — no navbar, no app screenshots,
  // no footer, no App Store badge. joincandid.co + custom_domain pages keep
  // the existing full-bleed hero (see the main return below).
  if (candidtutors_brand) {
    const heroImage = tutor.web_bg_picture_url || tutor.large_profile_picture_url;
    // The tutor's own clips for the marquee below the card. Additive chrome — a fetch
    // failure (incl. the pre-deploy 404) falls back to [] so it never breaks the card.
    const clips = await fetchMarketingClips(locale, slug).catch(() => [] as MarketingClip[]);
    return (
      <main
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
      >
        <header className="px-6 md:px-10 pt-8">
          <a href="/" className="inline-block">
            <Image
              src="/wordmark-white.svg"
              alt="Candid"
              width={72}
              height={36}
              priority
              className="hover:opacity-80 transition-opacity"
            />
          </a>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12">
          <div
            className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            {heroImage ? (
              // Plain <img> direct from S3 — bypasses /_next/image transcode hop.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage}
                alt={tutor.name}
                className="w-full aspect-[16/9] object-cover"
              />
            ) : (
              <div
                className="w-full aspect-[16/9]"
                style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
              />
            )}
            <div className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-semibold mb-2">{tutor.name}</h1>
              <p
                className="text-base md:text-lg font-light leading-snug mb-6"
                style={{ color: "rgba(255,255,255,0.75)" }}
                dangerouslySetInnerHTML={{ __html: coolTitle }}
              />
              {tutor.web_letter && (
                <p className="text-base leading-relaxed mb-8 whitespace-pre-line" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {tutor.web_letter}
                </p>
              )}
              <JoinForFreePill
                label={t("study_with", { name: localizedFirstName })}
                variant="card"
              />
            </div>
          </div>
        </div>
        {/* Tutor's own clips — full-width row below the card (breaks out of max-w-2xl). */}
        {clips.length > 0 && (
          <div className="w-full">
            <MarketingClipMarquee clips={clips} />
          </div>
        )}
        <footer className="px-6 py-6 flex items-center justify-between flex-wrap gap-4 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          <p>&copy; {new Date().getFullYear()} The Fluency Project Inc.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:opacity-70 transition-opacity">
              {t_footer("privacy")}
            </Link>
            <Link href="/terms" className="hover:opacity-70 transition-opacity">
              {t_footer("terms")}
            </Link>
          </div>
        </footer>
        <JoinForFreeSheet
          tutor_name={localizedFirstName}
          tutor_slug={slug}
          locale={join_for_free_locale}
        />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
    >
      {/* ─── Fixed Navbar ─── */}
      <TutorNavbar
        sentinelId="hero-sentinel"
        downloadUrl={`/download/${slug}`}
        alwaysWhite={Boolean(config.hero?.textColor)}
        mobileDark={slug === "english-adam"}
        rightElement={
          join_for_free ? (
            <>
              <JoinForFreePill label={t("join_for_free")} variant="navbar-pill" />
              <JoinForFreePill label={t("join_for_free")} variant="mobile-navbar-pill" />
            </>
          ) : candidtutors_brand ? (
            // Top-right intentionally empty on tutor pages: desktop has the inline
            // hero badge, mobile has the bottom sticky CTA — top-right pill is redundant.
            <></>
          ) : (
            <>
              {/* Desktop: Get the app pill (App Store badge moves inline under hero) */}
              <a
                href={`/download/${slug}`}
                data-tutor-name={localizedFirstName}
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
          )
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
            className="hidden lg:block absolute inset-0 pointer-events-none"
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
            background: config.photo.mobileFade
              ?? "linear-gradient(to bottom, transparent 45%, rgba(24,24,28,0.52) 60%, rgba(24,24,28,0.91) 75%, rgba(24,24,28,1) 90%, #18181C 100%)",
          }}
        />

        {/* Desktop text content — left side. Bumped weight on desktop when the
            hero text override is white so it stays readable on busy backgrounds. */}
        <div className="relative z-10 hidden lg:flex flex-col justify-start min-h-screen px-12 pt-[100px] pb-24">
          <h1
            className={`hero-heading ${config.hero?.textShadow ? "hero-heading--shadowed" : ""} text-[2.7rem] xl:text-[3.375rem] font-light lg:font-medium leading-[1.15] mb-[1.125rem] animate-fade-in-up`}
            style={{ color: config.hero?.textColor ?? "#18181C", textShadow: config.hero?.textShadow }}
            dangerouslySetInnerHTML={{ __html: coolTitle }}
          />
          <p
            className={`text-[1.2375rem] xl:text-[1.39rem] font-light leading-snug mb-5 animate-fade-in-up-delay-1`}
            style={{ color: config.hero?.textColor ?? "#18181C", textShadow: config.hero?.textShadow }}
            dangerouslySetInnerHTML={{ __html: subtitleHtml }}
          />
          {uses_join_sheet ? (
            // candidtutors.co + custom_domain → opens the Join-for-free sheet, not the App Store.
            <JoinForFreePill
              label={
                candidtutors_brand
                  ? t("study_with", { name: localizedFirstName })
                  : t("join_for_free")
              }
              variant="hero-pill"
            />
          ) : (
            <a
              href={`/download/${slug}`}
              data-tutor-name={localizedFirstName}
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
          )}
          {/* Hidden until further notice; superseded by inline App Store badge above. */}
          <div className="hidden">
            <QRCode slug={slug} label={t("download_qr")} />
          </div>
        </div>

        {/* Mobile text content — bottom, centered. Slim bottom padding so the
            headline sits ~10% lower in the hero. */}
        <div className="relative z-10 lg:hidden flex flex-col items-center justify-end min-h-[80vh] px-6 pb-[3svh] text-center">
          <h1
            className="hero-heading font-medium leading-tight mb-4 animate-fade-in-up"
            style={{ color: "#FFFFFF", fontSize: "clamp(1.6rem, 7.5vw, 2.85rem)", textShadow: config.hero?.textShadow }}
            dangerouslySetInnerHTML={{ __html: coolTitle }}
          />
          <p
            className="text-base font-light leading-relaxed max-w-sm animate-fade-in-up-delay-1"
            style={{ color: "#FFFFFF", textShadow: config.hero?.textShadow }}
            dangerouslySetInnerHTML={{ __html: subtitleMobileHtml }}
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
        <div id="hero-sentinel" className="absolute w-full h-1" style={{ top: slug === "english-adam" ? "30%" : "60%" }} />
      </section>


      {/* ─── App Screenshots with Sticky Headers ─── */}
      {(() => {
        const tVars = { firstName: localizedFirstName, language: langLabel };
        const country = localizeMapCountry(tutor.teaching_language, locale);
        const screenshots = [
          { url: tutor.screenshot_listen_url, title: t("listen", tVars) },
          { url: tutor.screenshot_week_url, title: t("week", tVars) },
          { url: tutor.screenshot_shadow_url, title: t("shadow", tVars) },
          { url: tutor.screenshot_map_url, title: t("map", { firstName: localizedFirstName, country }) },
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
      {/* tutor variant on candidtutors.co + per-tutor custom_domain — drops
          App Store + Programs, swaps IG to @candidtutors. */}
      <SiteFooter variant={uses_join_sheet ? "tutor" : "joincandid"} />
      <MobileCTABar
        downloadUrl={`/download/${slug}`}
        ctaLabel={
          use_study_club_framing
            ? t("study_with", { name: localizedFirstName })
            : join_for_free
              ? t("join_for_free")
              : t("get_started")
        }
        ctaSubtext={
          join_for_free ? t("join_for_free_subtext") : t("no_credit_card")
        }
        mode={uses_join_sheet ? "join" : "download"}
        alwaysVisible
      />
      {uses_join_sheet && (
        <JoinForFreeSheet
          tutor_name={localizedFirstName}
          tutor_slug={slug}
          locale={join_for_free_locale}
        />
      )}
    </main>
  );
}
