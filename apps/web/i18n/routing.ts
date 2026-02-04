import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "as-needed", // Korean has no prefix, English uses /en
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
