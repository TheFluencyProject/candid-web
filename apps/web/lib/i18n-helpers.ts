import { isLocale, type Locale } from "@/i18n/routing";

/**
 * Resolve the UI locale from request headers.
 *
 * Browser language decides; `country` (Vercel's x-vercel-ip-country) only breaks a
 * tie. An English speaker in Korea is usually there to *learn* Korean, so they keep
 * the English pitch — geo alone never flips the locale.
 *
 * Takes plain strings rather than a NextRequest or headers(): middleware runs on
 * Edge and the top-level routes run in RSC, and only a runtime-agnostic signature
 * can be imported by both.
 */
export function pickLocale(acceptLanguage: string | null, country?: string | null): Locale {
  // "zh-Hant-TW;q=0.8" → "zh-Hant-TW" → zh-Hant.
  const tags = (acceptLanguage ?? "").split(",").map((part) => part.split(";")[0].trim()).filter(Boolean);
  const locales = tags.map(siteLocaleForTag);
  const primary = locales[0] ?? null;
  if (primary && primary !== "en") return primary;
  // Korean isn't the primary tag, but it's accepted (or nothing is) and the request
  // is from Korea — e.g. a local whose phone UI is set to English.
  if (country?.toUpperCase() === "KR" && (!tags.length || locales.includes("ko"))) return "ko";
  if (primary === "en") return "en";
  // Primary language isn't one we serve (say de): take the first one listed that we do.
  return locales.find((l): l is Locale => l !== null) ?? "en";
}

/**
 * The site locale for one BCP 47 tag ("ko-KR" → ko), or null when the site doesn't speak it.
 * Chinese splits by script: zh-Hant, or a Taiwan / Hong Kong region with no script, gets
 * Traditional; every other zh-* gets /zh (Simplified). Case-insensitive.
 */
export function siteLocaleForTag(tag: string): Locale | null {
  const [base, ...subtags] = tag.toLowerCase().split("-");
  if (base === "zh") {
    if (subtags.includes("hans")) return "zh";
    return subtags.some((s) => s === "hant" || s === "tw" || s === "hk") ? "zh-Hant" : "zh";
  }
  return isLocale(base) ? base : null;
}

const LANG_NAMES: Partial<Record<Locale, Record<string, string>>> = {
  ko: { english: "영어", korean: "한국어" },
  ja: { english: "英語", korean: "韓国語" },
  zh: { english: "英语", korean: "韩语" },
  "zh-Hant": { english: "英語", korean: "韓語" },
  es: { english: "inglés", korean: "coreano" },
  ru: { english: "английский", korean: "корейский" },
  fr: { english: "anglais", korean: "coréen" },
  vi: { english: "tiếng Anh", korean: "tiếng Hàn" },
  th: { english: "ภาษาอังกฤษ", korean: "ภาษาเกาหลี" },
  id: { english: "bahasa Inggris", korean: "bahasa Korea" },
};

export function localizeLanguageName(lang: string, locale: string): string {
  return LANG_NAMES[locale as Locale]?.[lang] ?? capitalize(lang);
}

const MAP_COUNTRIES: Partial<Record<Locale, Record<string, string>>> = {
  en: { english: "America", korean: "Korea" },
  ko: { english: "미국인", korean: "한국인" },
  ja: { english: "アメリカ", korean: "韓国" },
  zh: { english: "美国", korean: "韩国" },
  "zh-Hant": { english: "美國", korean: "韓國" },
  es: { english: "Estados Unidos", korean: "Corea" },
  ru: { english: "Америку", korean: "Корею" },
  fr: { english: "les États-Unis", korean: "la Corée" },
  vi: { english: "Mỹ", korean: "Hàn Quốc" },
  th: { english: "อเมริกา", korean: "เกาหลี" },
  id: { english: "Amerika", korean: "Korea" },
};

export function localizeMapCountry(teachingLanguage: string, locale: string): string {
  const map = MAP_COUNTRIES[locale as Locale] ?? MAP_COUNTRIES.en!;
  return map[teachingLanguage] ?? capitalize(teachingLanguage);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function titleCase(s: string): string {
  return s.toLowerCase().split(/\s+/).map(capitalize).join(" ");
}

export function withKoreanParticle(name: string): string {
  return `${name}쌤과`;
}

export function stripEmojis(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/\u200D/g, "")
    .replace(/[ \t]+(?=[\n\r])/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Renders a tutor's cool_title with the second line emphasized.
 * The DB value typically embeds a literal `\n` to separate the two lines;
 * we also auto-insert one before " & " when the value is single-line so new
 * tutors don't have to remember the convention. The second line is wrapped in
 * <em>, which globals.css styles with Sriracha/italic/bold.
 */
export function formatHeroTitle(text: string | null | undefined): string {
  if (!text) return "";
  let cleaned = stripEmojis(text);
  // Auto-break before " & " for values without an explicit newline.
  if (!cleaned.includes("\n")) {
    const ampIdx = cleaned.indexOf(" & ");
    if (ampIdx !== -1) {
      cleaned = cleaned.slice(0, ampIdx) + "\n&" + cleaned.slice(ampIdx + 2);
    }
  }
  const idx = cleaned.indexOf("\n");
  if (idx === -1) return cleaned;
  const line1 = cleaned.slice(0, idx);
  const line2 = cleaned.slice(idx + 1);

  // On mobile only, break line 1 after " to " so "Your guide to" sits on its own
  // line above the rest. Desktop keeps line 1 single-line via `.hero-line1`'s
  // white-space:nowrap. The trailing space stays in the prefix so desktop reads
  // "Your guide to conversational …" when the break-span is display:none.
  // Korean line 1 has no " to " — no-op there, wraps naturally.
  const toIdx = line1.indexOf(" to ");
  const line1Html = toIdx === -1
    ? line1
    : `${line1.slice(0, toIdx + 4)}<span class="hero-break-mobile"></span>${line1.slice(toIdx + 4)}`;

  return `<span class="hero-line1">${line1Html}</span><span class="hero-break-all"></span><em>${line2}</em>`;
}
