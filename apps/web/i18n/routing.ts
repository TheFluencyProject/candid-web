import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "ko"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // Browser-language detection is gated to the first visit only by our own
  // middleware (see middleware.ts) so users who manually delete `/ko` from
  // the URL aren't auto-redirected back. The next-intl built-in flag stays
  // off — we run detection ourselves before delegating.
  localeDetection: false,
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
