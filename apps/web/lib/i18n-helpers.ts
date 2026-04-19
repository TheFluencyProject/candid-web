const KO_LANG_NAMES: Record<string, string> = { english: "영어", korean: "한국어" };

export function localizeLanguageName(lang: string, locale: string): string {
  if (locale === "ko") return KO_LANG_NAMES[lang] ?? capitalize(lang);
  return capitalize(lang);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function withKoreanParticle(name: string): string {
  return name === "미아" ? `${name}와` : `${name}과`;
}

/**
 * Renders a tutor's cool_title with the second line emphasized.
 * The DB value comes with a literal `\n` separating the two lines; we wrap the
 * second line in <em>, which globals.css styles with Sriracha/italic/bold.
 * Single-line values are returned as-is.
 */
export function formatHeroTitle(text: string | null | undefined): string {
  if (!text) return "";
  const idx = text.indexOf("\n");
  if (idx === -1) return text;
  const line1 = text.slice(0, idx);
  const line2 = text.slice(idx + 1);
  return `<span class="hero-line1">${line1}</span><span class="hero-break-all"></span><em>${line2}</em>`;
}
