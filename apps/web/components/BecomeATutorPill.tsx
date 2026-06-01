"use client";

interface Props {
  label: string;
  href: string;
  variant?: "navbar-pill" | "mobile-navbar-pill" | "landing-pill";
}

// Become-a-tutor link.
//  - navbar-pill / mobile-navbar-pill: translucent white, secondary on candidtutors.co header.
//  - landing-pill: PRIMARY CTA on the candidtutors.co/ hero — solid white bg, dark text.
//    Same padding as the secondary pill so the two stack at matching size.
export default function BecomeATutorPill({ label, href, variant = "navbar-pill" }: Props) {
  const is_landing = variant === "landing-pill";
  const className = variant === "mobile-navbar-pill"
    ? "lg:hidden px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap"
    : is_landing
      ? "px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide w-full sm:w-auto text-center"
      : "hidden lg:block px-5 py-2 rounded-full text-sm font-semibold";

  const style = is_landing
    ? { backgroundColor: "#FFFFFF", color: "#18181C" }
    : { backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF" };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
    >
      {label}
    </a>
  );
}
