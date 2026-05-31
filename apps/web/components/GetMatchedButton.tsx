"use client";

import { openMatchIntake } from "@/lib/match-intake-store";

// Client wrapper for the primary CTA on the candidtutors.co landing.
// Landing component is a Server Component, so the onClick handler has to live in
// its own client file.
export default function GetMatchedButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={openMatchIntake}
      className="px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide w-full sm:w-auto"
      style={{ backgroundColor: "#FFFFFF", color: "#18181C" }}
    >
      {label}
    </button>
  );
}
