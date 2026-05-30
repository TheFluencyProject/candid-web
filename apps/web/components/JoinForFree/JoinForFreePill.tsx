"use client";

import { openJoinForFree } from "@/lib/join-for-free-store";

interface Props {
  label: string;
  variant?: "navbar-pill" | "mobile-navbar-pill";
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
