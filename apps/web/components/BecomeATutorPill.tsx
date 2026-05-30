"use client";

interface Props {
  label: string;
  href: string;
  variant?: "navbar-pill" | "mobile-navbar-pill";
}

// Secondary CTA on candidtutors.co. Less prominent than the primary
// "Find your tutor" pill — white text on a translucent white bg, same shape.
export default function BecomeATutorPill({ label, href, variant = "navbar-pill" }: Props) {
  const className = variant === "mobile-navbar-pill"
    ? "lg:hidden px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap"
    : "hidden lg:block px-5 py-2 rounded-full text-sm font-semibold";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF" }}
    >
      {label}
    </a>
  );
}
