const KO_LANG_NAMES: Record<string, string> = { english: "영어", korean: "한국어" };

export function localizeLanguageName(lang: string, locale: string): string {
  if (locale === "ko") return KO_LANG_NAMES[lang] ?? capitalize(lang);
  return capitalize(lang);
}

const MAP_COUNTRY_EN: Record<string, string> = { english: "America", korean: "Seoul" };
const MAP_COUNTRY_KO: Record<string, string> = { english: "미국인", korean: "한국인" };

export function localizeMapCountry(teachingLanguage: string, locale: string): string {
  const map = locale === "ko" ? MAP_COUNTRY_KO : MAP_COUNTRY_EN;
  return map[teachingLanguage] ?? capitalize(teachingLanguage);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function withKoreanParticle(name: string): string {
  return name === "미아" ? `${name}와` : `${name}과`;
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
 * The DB value comes with a literal `\n` separating the two lines; we wrap the
 * second line in <em>, which globals.css styles with Sriracha/italic/bold.
 * Single-line values are returned as-is.
 */
export function formatHeroTitle(text: string | null | undefined): string {
  if (!text) return "";
  const cleaned = stripEmojis(text);
  const idx = cleaned.indexOf("\n");
  if (idx === -1) return cleaned;
  const line1 = cleaned.slice(0, idx);
  const line2 = cleaned.slice(idx + 1);
  return `<span class="hero-line1">${line1}</span><span class="hero-break-all"></span><em>${line2}</em>`;
}
