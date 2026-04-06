import Image from "next/image";

export default function SiteFooter({
  privacyLabel,
  termsLabel,
}: {
  privacyLabel: string;
  termsLabel: string;
}) {
  return (
    <footer className="border-t border-white/10">
      {/* Main footer grid */}
      <div className="grid grid-cols-2 gap-8 px-6 py-10 lg:grid-cols-4 lg:px-12 lg:py-12">
        {/* App Store — desktop only */}
        <div className="hidden lg:flex flex-col items-start">
          <span className="cursor-default">
            <Image
              src="/download.svg"
              alt="Download on the App Store"
              width={140}
              height={46}
            />
          </span>
        </div>

        {/* Pages */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">Pages</h4>
          <ul className="space-y-2">
            <li>
              <a href="/" className="text-sm opacity-50 hover:opacity-70 transition-opacity">Home</a>
            </li>
          </ul>
        </div>

        {/* Guides */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">Programs</h4>
          <ul className="space-y-2">
            <li>
              <a href="/guide/english-adam" className="text-sm opacity-50 hover:opacity-70 transition-opacity">English with Adam</a>
            </li>
            <li>
              <a href="/guide/korean-mia" className="text-sm opacity-50 hover:opacity-70 transition-opacity">Korean with Mia</a>
            </li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">Connect</h4>
          <ul className="space-y-2">
            {/* Instagram — temporarily hidden */}
            <li>
              <a
                href="mailto:support@thefluencyproject.co"
                className="text-sm opacity-50 hover:opacity-70 transition-opacity flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                support@thefluencyproject.co
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar — always visible */}
      <div className="px-6 py-6 pb-32 md:pb-6 md:px-12 flex items-center justify-between flex-wrap gap-4 border-t border-white/5">
        <div className="flex gap-6 items-center">
          <a href="/privacy" className="text-sm opacity-50 hover:opacity-70 transition-opacity">
            {privacyLabel}
          </a>
          <a href="/terms" className="text-sm opacity-50 hover:opacity-70 transition-opacity">
            {termsLabel}
          </a>
          <span className="text-sm opacity-50">
            ElevenLabs Partner
          </span>
        </div>
        <p className="text-sm opacity-30">
          &copy; {new Date().getFullYear()} The Fluency Project
        </p>
      </div>
    </footer>
  );
}
