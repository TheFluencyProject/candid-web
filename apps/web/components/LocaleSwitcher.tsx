"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";

// Escape hatch for anyone the middleware's Accept-Language/geo detection routed to the
// wrong language. Endonyms, matching the tutor dashboard's switcher.
const LOCALES = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
] as const;

export default function LocaleSwitcher() {
  // localePrefix "as-needed" — this pathname has no locale prefix, so passing it back
  // with an explicit `locale` swaps languages while staying on the same page.
  const pathname = usePathname();
  const active = useLocale();

  return (
    <div className="flex gap-3 items-center">
      {LOCALES.map(({ code, label }) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          className={
            code === active
              ? "text-sm font-normal text-white"
              : "text-sm font-normal text-white/70 hover:text-white transition-colors"
          }
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
