import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import MobileCTABar from "@/components/MobileCTABar";
import TutorNavbar from "@/components/TutorNavbar";
import StickyHeader from "@/components/StickyHeader";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import BlurImage from "@/components/BlurImage";
import SiteFooter from "@/components/SiteFooter";
import JoinForFreePill from "@/components/JoinForFree/JoinForFreePill";
import JoinForFreeSheet from "@/components/JoinForFree/JoinForFreeSheet";
import MarketingClipMarquee from "@/components/MarketingClipMarquee";
import { localizeLanguageName, localizeMapCountry, capitalize, withKoreanParticle, formatHeroTitle } from "@/lib/i18n-helpers";
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

  // Tab title: "<Language> with <Name> | Candid" (e.g. "Korean with Mia | Candid").
  let title: string;
  if (locale === "ko") {
    const koreanLang = localizeLanguageName(tutor.teaching_language, "ko");
    const koreanName = (tutor.metadata?.name_kr as string) ?? tutor.name;
    title = `${withKoreanParticle(koreanName)} 함께하는 ${koreanLang} | Candid`;
  } else {
    title = `${capitalize(tutor.teaching_language)} with ${tutor.name} | Candid`;
  }
  // Flatten the \n in cool_title for HTML meta description (single-line expected).
  const description = (tutor.cool_title ?? tutor.short_description ?? "").replace(/\n/g, " ");
  // Mia's page uses the hand-made OG preview; other tutors fall back to their hero/profile image.
  const ogImage =
    slug === "korean-mia"
      ? "https://joincandid.co/mia-og-preview.png"
      : (tutor.web_bg_picture_url || tutor.large_profile_picture_url);

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

// App-screenshot sections are hidden for now — kept in code for a later day.
const SHOW_APP_SCREENSHOTS: boolean = false;

// Round-robin the language's clips across tutors so the row alternates one-by-one
// (mirrors SimpleLanding's interleave). The current tutor's group goes first.
function interleaveByTutor(clips: MarketingClip[], currentTutorName: string): MarketingClip[] {
  const groups = new Map<string, MarketingClip[]>();
  for (const c of clips) {
    const g = groups.get(c.tutor_name) ?? [];
    g.push(c);
    groups.set(c.tutor_name, g);
  }
  const ordered = [
    ...(groups.has(currentTutorName) ? [groups.get(currentTutorName)!] : []),
    ...[...groups.entries()].filter(([name]) => name !== currentTutorName).map(([, g]) => g),
  ];
  const out: MarketingClip[] = [];
  const max = Math.max(0, ...ordered.map((g) => g.length));
  for (let i = 0; i < max; i++) {
    for (const g of ordered) {
      if (i < g.length) out.push(g[i]);
    }
  }
  return out;
}

export default async function TutorPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [tutor, t, t_footer, host_header, sp, clips] = await Promise.all([
    fetchTutor(slug, locale),
    getTranslations("tutor"),
    getTranslations("footer"),
    headers().then(h => h.get("host") ?? ""),
    searchParams,
    fetchMarketingClips(locale, { slug }).catch(() => [] as MarketingClip[]),
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
  // Karaoke captions are the default; ?karaoke=0 shows the old per-word-highlight style.
  const karaoke = sp.karaoke !== "0";

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
  // Web-only override; falls back to cool_title (and short_description for legacy API responses) when null.
  const coolTitle = formatHeroTitle(tutor.web_title_override ?? tutor.cool_title ?? tutor.short_description);
  // Speaking-screenshot hero copy: one tagline for every tutor; subtitle stays personalized.
  const heroName = locale === "ko" ? withKoreanParticle(localizedFirstName) : localizedFirstName;
  const heroTitle = t("hero_tagline_vertical"); // "Less scrolling.\nMore speaking." (two forced lines)
  const heroSubtitle = t("hero_subtitle_alt", { language: langLabel, name: heroName });
  // The speaking/shadowing app screenshot shown in the hero phone frame.
  const speakingShot = tutor.screenshot_shadow_url ?? tutor.screenshot_listen_url ?? tutor.web_bg_picture_url ?? tutor.large_profile_picture_url;

  // ─── simplified card layout (candidtutors.co + joincandid.co) ───────────
  // Single centered card on the dark page — no navbar, no app screenshots,
  // no App Store badge. candidtutors.co's CTA opens the web-signup sheet;
  // joincandid.co's CTA routes to the App Clip funnel. custom_domain pages
  // keep the full-bleed hero (see the main return below).
  if (candidtutors_brand) {
    const heroImage = tutor.web_bg_picture_url || tutor.large_profile_picture_url;
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
            <MarketingClipMarquee clips={clips} karaoke={karaoke} />
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

  // joincandid.co / custom_domain full page. The clips row pulls from EVERY active tutor
  // teaching this language (not just this one) and alternates one-by-one, current first.
  const languageClips = await fetchMarketingClips(locale, { language: tutor.teaching_language }).catch(
    () => [] as MarketingClip[],
  );
  const creatorClips = interleaveByTutor(languageClips, tutor.name);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
    >
      {/* ─── Fixed Navbar ─── */}
      <TutorNavbar
        sentinelId="hero-sentinel"
        downloadUrl={`/download/${slug}`}
        alwaysWhite
        revealRightOnScroll={!uses_join_sheet}
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
            // joincandid: green "TRY FOR FREE" pill, revealed top-right on scroll (revealRightOnScroll).
            // Desktop only — mobile uses the bottom MobileCTABar.
            <a
              href={`/download/${slug}`}
              data-tutor-name={localizedFirstName}
              className="hidden lg:inline-block px-5 py-2 rounded-full text-sm font-bold"
              style={{ backgroundColor: "#89FFB4", color: "#000000" }}
            >
              {t("get_started")}
            </a>
          )
        }
      />

      {/* ─── Speaking-screenshot hero ─── */}
      <section className="relative px-6 md:px-12 pt-[84px] md:pt-[96px] pb-12 md:pb-16 lg:flex lg:items-center lg:min-h-screen lg:pt-0 lg:pb-0">
        <div className="mx-auto w-full max-w-6xl flex flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-32">
          {/* Text column */}
          <div className="lg:max-w-xl">
            <h1
              className="hero-heading font-medium leading-[1.05] whitespace-pre-line text-[clamp(1.95rem,9vw,2.8rem)] lg:text-[3.15rem] mb-4 md:mb-5 animate-fade-in-up"
              style={{ color: "#FFFFFF" }}
            >
              {heroTitle}
            </h1>
            <p
              className="text-lg md:text-xl font-light leading-snug max-w-md animate-fade-in-up-delay-1"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {heroSubtitle}
            </p>
            {/* Desktop CTA — joincandid: scan-to-install QR; custom_domain: join pill.
                Mobile uses the bottom MobileCTABar either way. */}
            {uses_join_sheet ? (
              <div className="hidden lg:block mt-8 animate-fade-in-up-delay-2">
                <JoinForFreePill label={t("join_for_free")} variant="hero-pill" />
              </div>
            ) : (
              <div className="hidden lg:block mt-8 animate-fade-in-up-delay-2">
                <a
                  href={`/download/${slug}`}
                  data-tutor-name={localizedFirstName}
                  className="inline-block px-12 py-3.5 rounded-full text-base font-bold"
                  style={{ backgroundColor: "#89FFB4", color: "#000000" }}
                >
                  {t("get_started")}
                </a>
              </div>
            )}
          </div>

          {/* Speaking (shadowing) screenshot — no device frame, just the rounded screen */}
          {speakingShot && (
            <div className="flex justify-center mt-6 lg:mt-0 animate-fade-in-up-delay-1">
              {/* Plain <img> direct from S3 — bypasses the /_next/image transcode hop. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={speakingShot}
                alt={t("shadow", { firstName: localizedFirstName, language: langLabel })}
                className="block w-full max-w-[270px] lg:max-w-[400px] lg:max-h-[80vh] rounded-[2.5rem] shadow-2xl"
              />
            </div>
          )}
        </div>

        {/* Sentinel — drives the navbar CTA reveal on scroll. */}
        <div id="hero-sentinel" className="absolute inset-x-0 h-1" style={{ top: "70%" }} />
      </section>

      {/* ─── Centered profile photo + the tutor's written letter ─── */}
      {tutor.web_letter && (
        <section className="flex flex-col items-center text-center px-6 pt-14 md:pt-20 pb-10 md:pb-14">
          {(tutor.large_profile_picture_url || tutor.profile_picture_url) && (
            // Plain <img> direct from S3 — bypasses the /_next/image transcode hop.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(tutor.large_profile_picture_url || tutor.profile_picture_url)!}
              alt={tutor.name}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shadow-2xl mb-6"
            />
          )}
          <p
            className="max-w-xl text-base md:text-lg leading-relaxed whitespace-pre-line"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {tutor.web_letter}
          </p>
        </section>
      )}

      {/* ─── "Learn with {name} & other creators" — clips from every tutor of this
             language, alternating one-by-one (current tutor first). Min 3 to show. ─── */}
      {creatorClips.length >= 3 && (
        <div className="w-full pt-16 md:pt-28 pb-16 md:pb-28">
          <div className="mx-auto max-w-6xl px-6 md:px-12 mb-4 md:mb-6">
            <h2
              className="hero-heading font-medium leading-[1.05] text-[clamp(1.95rem,9vw,2.8rem)] lg:text-[3.15rem]"
              style={{ color: "#FFFFFF" }}
            >
              {t("learn_with_creators", { name: localizedFirstName })}
            </h2>
            <p
              className="mt-3 text-lg md:text-xl font-light leading-snug max-w-2xl"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {t("creators_subtitle", { language: langLabel })}
            </p>
          </div>
          <MarketingClipMarquee clips={creatorClips} karaoke={karaoke} />
        </div>
      )}

      {/* ─── App Screenshots with Sticky Headers — hidden for now, kept for a later day ─── */}
      {SHOW_APP_SCREENSHOTS && (() => {
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
