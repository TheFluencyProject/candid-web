import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // The app's 12 languages. /zh is Simplified Chinese (the app ships zh-Hans only).
  locales: ["en", "ko", "ja", "zh", "es", "ru", "fr", "vi", "th", "id", "de", "it"],
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
