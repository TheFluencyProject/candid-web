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
