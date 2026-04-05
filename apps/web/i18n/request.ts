import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      typeof result[key] === "object" && result[key] !== null &&
      typeof override[key] === "object" && override[key] !== null &&
      !Array.isArray(result[key]) && !Array.isArray(override[key])
    ) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, override[key] as Record<string, unknown>);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that the incoming locale is valid
  if (!locale || !routing.locales.includes(locale as "ko" | "en")) {
    locale = routing.defaultLocale;
  }

  const enMessages = (await import("../messages/en.json")).default;

  if (locale === "en") {
    return { locale, messages: enMessages };
  }

  // For non-English locales, deep-merge with English as fallback
  const localeMessages = (await import(`../messages/${locale}.json`)).default;
  return {
    locale,
    messages: deepMerge(enMessages, localeMessages),
  };
});
