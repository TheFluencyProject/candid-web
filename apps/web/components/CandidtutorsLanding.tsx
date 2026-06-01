import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";
import BecomeATutorPill from "@/components/BecomeATutorPill";
import MatchIntakeOverlay from "@/components/MatchIntakeOverlay";
import GetMatchedButton from "@/components/GetMatchedButton";
import { BECOME_A_TUTOR_URL } from "@/lib/platform";

/**
 * Stripped landing rendered for candidtutors.co/ only (host-conditional;
 * joincandid.co keeps the tutor carousel).
 *
 * Two CTAs: GET MATCHED WITH A TUTOR (opens MatchIntakeOverlay) +
 * BECOME A CANDID TUTOR (external Notion form).
 *
 * English-only — Korean visitors hitting candidtutors.co/ko/ see this same
 * English copy. The page is host-conditional, not locale-conditional.
 */
export default function CandidtutorsLanding() {
  return (
    <main style={{ backgroundColor: "#18181C" }}>
      {/* Hero section — always fills the full viewport (mobile + desktop).
          Footer sits below, scrolled to. */}
      <section className="min-h-screen flex flex-col">
        {/* Minimal header — wordmark only */}
        <header className="px-6 md:px-10 pt-8">
          <a href="/" className="inline-block">
            <Image
              src="/wordmark-white.svg"
              alt="Candid"
              width={72}
              height={36}
              priority
              className="hover:opacity-80 transition-opacity"
            />
          </a>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-16 md:py-24">
          <div className="max-w-2xl text-center text-white">
            <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-[1.1] mb-6">
              A better, more human way to learn languages
            </h1>
            <p className="text-lg md:text-xl leading-relaxed mb-10 text-gray-300">
              Candid Tutors help their students speak like no app alone could. Daily speaking practice, structured lessons, live classes, & more.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Primary CTA — recruit tutors. External Notion form. */}
              <BecomeATutorPill label="BECOME A CANDID TUTOR" href={BECOME_A_TUTOR_URL} variant="landing-pill" />
              {/* Secondary CTA — opens the match-intake overlay. */}
              <GetMatchedButton label="GET MATCHED WITH A TUTOR" />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter variant="tutor" />
      <MatchIntakeOverlay />
    </main>
  );
}
