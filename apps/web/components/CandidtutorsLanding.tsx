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
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#18181C" }}>
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
            Candid Tutors help you speak like no app alone could — with daily speaking practice, feedback & lessons from your tutor, & a community by your side.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Primary CTA — opens the match-intake overlay. */}
            <GetMatchedButton label="GET MATCHED WITH A TUTOR" />
            {/* Secondary CTA — external Notion form (existing). */}
            <BecomeATutorPill label="BECOME A CANDID TUTOR" href={BECOME_A_TUTOR_URL} variant="landing-pill" />
          </div>
        </div>
      </div>

      <SiteFooter />
      <MatchIntakeOverlay />
    </main>
  );
}
