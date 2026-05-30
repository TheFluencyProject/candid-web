import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { localizeLanguageName, titleCase } from "@/lib/i18n-helpers";
import { fetchTutor } from "@/lib/api";

export default async function SiteFooter() {
  const t = await getTranslations("footer");
  const locale = await getLocale();

  const [adam, mia] = await Promise.all([
    fetchTutor("english-adam", locale),
    fetchTutor("korean-mia", locale),
  ]);

  // DB titles are uppercase; title-case for footer display, fallback if API down
  const adamTitle = titleCase(adam?.title ?? "American Dream");
  const miaTitle = titleCase(mia?.title ?? "Seoulmates");

  return (
    <footer className="border-t border-white/10">
      {/* Main footer grid */}
      <div className="grid grid-cols-1 px-6 py-14 lg:grid-cols-5 lg:gap-8 lg:px-12 lg:py-12">
        {/* App Store — desktop only */}
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

        {/* Pages — mobile col 1 row 1 */}
        <div>
          <h4 className="text-xl font-bold uppercase tracking-wider mb-3 text-white">{t("pages_heading")}</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">{t("home")}</Link>
            </li>
          </ul>
        </div>

        {/* Programs */}
        <div className="mt-14 lg:mt-0">
          <h4 className="text-xl font-bold uppercase tracking-wider mb-3 text-white">{t("programs_heading")}</h4>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">{localizeLanguageName("english", locale)}</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/guide/english-adam" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">{adamTitle}</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">{localizeLanguageName("korean", locale)}</p>
              {/* Footer lists active tutors only. Chan (CHINGU) is is_enabled=false
                  for now — add her back here when she's flipped live. */}
              <ul className="space-y-2">
                <li>
                  <Link href="/guide/korean-mia" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">{miaTitle}</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Company */}
        <div className="mt-14 lg:mt-0">
          <h4 className="text-xl font-bold uppercase tracking-wider mb-3 text-white">{t("company_heading")}</h4>
          <ul className="space-y-2">
            <li>
              {/* HTTP-only: Namecheap URL forwarding has no SSL cert, so https:// times out */}
              <a href="http://thefluencyproject.co" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">The Fluency Project</a>
            </li>
            <li>
              {/* HTTP-only: Namecheap URL forwarding has no SSL cert, so https:// times out */}
              <a href="http://thefluencyfiles.com" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">The Fluency Files</a>
            </li>
            <li>
              <a href="https://thefluencyproject.org" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">TheFluencyProject.org</a>
            </li>
            {/* <li>
              <a href="https://open.substack.com/pub/thefluencyfiles/p/introducing-candid?utm_source=candid&utm_medium=website&utm_campaign=landing-page" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">{t("company_letter")}</a>
            </li> */}
          </ul>
        </div>

        {/* Socials — desktop col 4, mobile last (separated from Programs by a hairline on mobile) */}
        <div className="mt-14 lg:mt-0">
          <h4 className="text-xl font-bold uppercase tracking-wider mb-3 text-white">{t("connect_heading")}</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="https://instagram.com/join.candid"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-normal text-white hover:opacity-70 transition-opacity flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                @join.candid
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

      {/* Bottom bar — always visible */}
      <div className="px-6 py-6 pb-20 md:pb-6 md:px-12 flex items-center justify-between flex-wrap gap-4 border-t border-white/5">
        <div className="flex gap-6 items-center">
          <Link href="/privacy" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="text-sm font-normal text-white hover:opacity-70 transition-opacity">
            {t("terms")}
          </Link>
          <span className="text-sm opacity-50">
            {t("elevenlabs_partner")}
          </span>
        </div>
        <p className="text-sm opacity-30">
          &copy; {new Date().getFullYear()} The Fluency Project Inc.
        </p>
      </div>
    </footer>
  );
}
