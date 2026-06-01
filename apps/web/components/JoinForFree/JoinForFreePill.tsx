"use client";

import { openJoinForFree } from "@/lib/join-for-free-store";

interface Props {
  label: string;
  variant?: "navbar-pill" | "mobile-navbar-pill" | "hero-pill" | "card";
}

export default function JoinForFreePill({ label, variant = "navbar-pill" }: Props) {
  const onClick = () => openJoinForFree();

  if (variant === "mobile-navbar-pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="lg:hidden px-4 py-2 rounded-full text-sm font-semibold"
        style={{ backgroundColor: "#FFFFFF", color: "#18181C" }}
      >
        {label}
      </button>
    );
  }

  if (variant === "card") {
    // Full-width green CTA used as the join button inside the simplified
    // candidtutors.co/tutor/[slug] card layout.
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full px-7 py-4 rounded-full text-base font-bold tracking-wide"
        style={{ backgroundColor: "#89FFB4", color: "#000000" }}
      >
        {label}
      </button>
    );
  }

  if (variant === "hero-pill") {
    // Prominent green inline pill — used under the desktop hero subtitle in
    // place of the App Store badge on candidtutors.co + custom-domain pages.
    return (
      <button
        type="button"
        onClick={onClick}
        className="animate-fade-in-up-delay-2 self-start px-7 py-3 rounded-full text-base font-bold tracking-wide"
        style={{ backgroundColor: "#89FFB4", color: "#000000" }}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden lg:block px-5 py-2 rounded-full text-sm font-semibold"
      style={{ backgroundColor: "#FFFFFF", color: "#18181C" }}
    >
      {label}
    </button>
  );
}
