import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // The app's 10 languages, with Chinese in both scripts: /zh is Simplified, /zh-Hant Traditional.
  locales: ["en", "ko", "ja", "zh", "zh-Hant", "es", "ru", "fr", "vi", "th", "id"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // Browser-language detection is gated to the first visit only by our own
  // middleware (see middleware.ts) so users who manually delete `/ko` from
  // the URL aren't auto-redirected back. The next-intl built-in flag stays
  // off — we run detection ourselves before delegating.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(s: string): s is Locale {
  return (routing.locales as readonly string[]).includes(s);
}

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
