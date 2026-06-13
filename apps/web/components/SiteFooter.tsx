import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { localizeLanguageName, titleCase } from "@/lib/i18n-helpers";
import { fetchTutor } from "@/lib/api";

interface SiteFooterProps {
  // "tutor" → candidtutors.co + per-tutor custom_domain pages: drops the
  // App Store badge + Programs section, swaps the Instagram handle.
  variant?: "joincandid" | "tutor";
  // Home page moved its App Store badge out of the header into the footer.
  appStoreBadge?: boolean;
}

export default async function SiteFooter({ variant = "joincandid", appStoreBadge = false }: SiteFooterProps = {}) {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const is_tutor = variant === "tutor";

  // Tutor variant doesn't render the Programs section, so skip the fetch.
  const [adam, mia] = is_tutor
    ? [null, null]
    : await Promise.all([
        fetchTutor("english-adam", locale),
        fetchTutor("korean-mia", locale),
      ]);

  // DB titles are uppercase; title-case for footer display, fallback if API down
  const adamTitle = titleCase(adam?.title ?? "American Dream");
  const miaTitle = titleCase(mia?.title ?? "Seoulmates");

  // tutor variant drops App Store + Programs → 3 cols (Pages, Company, Connect).
  const grid_cols = is_tutor ? "lg:grid-cols-3" : "lg:grid-cols-5";

  return (
    <footer className="border-t border-white/10">
      {/* Main footer grid — commented out for now; only the bottom bar remains.
          Email moved into the bottom bar below. Restore this block to bring
          back PAGES / PROGRAMS / COMPANY / CONNECT columns. */}
      {/*
      <div className={`grid grid-cols-1 px-6 py-14 ${grid_cols} lg:gap-8 lg:px-12 lg:py-12`}>
        {!is_tutor && (
          <div className="hidden lg:flex flex-col items-start">
            <Link href="/download">
              <Image
                src="/download.svg"
                alt="Download on the App Store"
                width={140}
                height={46}
              />
            </Link>
          </div>
        )}

        <div>
          <h4 className="text-xl font-bold uppercase tracking-wider mb-3 text-white">{t("pages_heading")}</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">{t("home")}</Link>
            </li>
          </ul>
        </div>

        {!is_tutor && (
          <div className="mt-14 lg:mt-0">
            <h4 className="text-xl font-bold uppercase tracking-wider mb-3 text-white">{t("programs_heading")}</h4>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">{localizeLanguageName("english", locale)}</p>
                <ul className="space-y-2">
                  <li>
                    <Link href="/tutor/english-adam" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">{adamTitle}</Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">{localizeLanguageName("korean", locale)}</p>
                <ul className="space-y-2">
                  <li>
                    <Link href="/tutor/korean-mia" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">{miaTitle}</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mt-14 lg:mt-0">
          <h4 className="text-xl font-bold uppercase tracking-wider mb-3 text-white">{t("company_heading")}</h4>
          <ul className="space-y-2">
            <li>
              <a href="http://thefluencyproject.co" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">The Fluency Project</a>
            </li>
            <li>
              <a href="http://thefluencyfiles.com" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">The Fluency Files</a>
            </li>
            <li>
              <a href="https://thefluencyproject.org" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">TheFluencyProject.org</a>
            </li>
          </ul>
        </div>

        <div className="mt-14 lg:mt-0">
          <h4 className="text-xl font-bold uppercase tracking-wider mb-3 text-white">{t("connect_heading")}</h4>
          <ul className="space-y-2">
            <li>
              <a
                href={is_tutor ? "https://instagram.com/candidtutors" : "https://instagram.com/join.candid"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-normal text-white hover:opacity-70 transition-opacity flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                {is_tutor ? "@candidtutors" : "@join.candid"}
              </a>
            </li>
            <li>
              <a
                href="mailto:adam@thefluencyproject.co"
                className="text-sm font-normal text-white hover:opacity-70 transition-opacity flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                adam@thefluencyproject.co
              </a>
            </li>
          </ul>
        </div>
      </div>
      */}

      {/* App Store badge — home page moved it here from the top-right header. */}
      {appStoreBadge && (
        <div className="px-6 pt-10 md:px-12">
          <a href="/download" className="inline-block">
            <img src="/download.svg" alt="Download on the App Store" width={140} className="h-auto" />
          </a>
        </div>
      )}

      {/* Bottom bar — always visible */}
      <div className="px-6 py-6 pb-20 md:pb-6 md:px-12 flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-6 items-center flex-wrap">
          <Link href="/privacy" className="text-sm font-normal text-white/70 hover:text-white transition-colors">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="text-sm font-normal text-white/70 hover:text-white transition-colors">
            {t("terms")}
          </Link>
          <a
            href="mailto:adam@thefluencyproject.co"
            className="text-sm font-normal text-white/70 hover:text-white transition-colors"
          >
            adam@thefluencyproject.co
          </a>
          <span className="text-sm font-normal text-white/70">
            {t("elevenlabs_partner")}
          </span>
        </div>
        <p className="text-sm font-normal text-white/70">
          &copy; {new Date().getFullYear()} The Fluency Project Inc.
        </p>
      </div>
    </footer>
  );
}
