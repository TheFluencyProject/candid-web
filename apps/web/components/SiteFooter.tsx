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
          <a href="/download" className="hover:opacity-90 transition-opacity">
            <Image
              src="/download.svg"
              alt="Download on the App Store"
              width={140}
              height={46}
            />
          </a>
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
            <li>
              <a
                href="https://instagram.com/trycandid"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm opacity-50 hover:opacity-70 transition-opacity flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                @trycandid
              </a>
            </li>
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
