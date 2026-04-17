import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function SiteFooter({
  locale,
}: {
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "footer" });

  return (
    <footer className="border-t border-white/10">
      {/* Main footer grid */}
      <div className="grid grid-cols-2 gap-8 px-6 py-10 lg:grid-cols-4 lg:px-12 lg:py-12">
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

        {/* Pages */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">{t("pages_heading")}</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-sm opacity-50 hover:opacity-70 transition-opacity">{t("home")}</Link>
            </li>
          </ul>
        </div>

        {/* Programs */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">{t("programs_heading")}</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/guide/english-adam" className="text-sm opacity-50 hover:opacity-70 transition-opacity">{t("english_with_adam")}</Link>
            </li>
            <li>
              <Link href="/guide/korean-mia" className="text-sm opacity-50 hover:opacity-70 transition-opacity">{t("korean_with_mia")}</Link>
            </li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">{t("connect_heading")}</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="https://instagram.com/join.candid"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm opacity-50 hover:opacity-70 transition-opacity flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                @join.candid
              </a>
            </li>
            <li>
              <a
                href="mailto:adam@thefluencyproject.co"
                className="text-sm opacity-50 hover:opacity-70 transition-opacity flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                adam@thefluencyproject.co
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar — always visible */}
      <div className="px-6 py-6 pb-32 md:pb-6 md:px-12 flex items-center justify-between flex-wrap gap-4 border-t border-white/5">
        <div className="flex gap-6 items-center">
          <Link href="/privacy" className="text-sm opacity-50 hover:opacity-70 transition-opacity">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="text-sm opacity-50 hover:opacity-70 transition-opacity">
            {t("terms")}
          </Link>
          <span className="text-sm opacity-50">
            {t("elevenlabs_partner")}
          </span>
        </div>
        <p className="text-sm opacity-30">
          &copy; {new Date().getFullYear()} The Fluency Project
        </p>
      </div>
    </footer>
  );
}
