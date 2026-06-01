"use client";

import { openMatchIntake } from "@/lib/match-intake-store";

// Secondary CTA on the candidtutors.co/ hero — opens the match-intake overlay.
// Landing is a Server Component, so the onClick must live in its own client file.
// Less prominent than BECOME A CANDID TUTOR (translucent white) since the
// primary funnel for this page is recruiting tutors.
export default function GetMatchedButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={openMatchIntake}
      className="px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide w-full sm:w-auto"
      style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF" }}
    >
      {label}
    </button>
  );
}
