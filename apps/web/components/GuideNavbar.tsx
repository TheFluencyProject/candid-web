"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function GuideNavbar({
  sentinelId,
  downloadUrl,
  alwaysWhite,
  rightElement,
}: {
  sentinelId: string;
  downloadUrl: string;
  alwaysWhite?: boolean;
  rightElement?: React.ReactNode;
}) {
  const [pastHero, setPastHero] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPastHero(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelId]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showWhite = alwaysWhite || pastHero;
  const showBg = scrolled;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 transition-[background-color,backdrop-filter] duration-300"
      style={{
        height: "var(--navbar-height, 64px)",
        backgroundColor: showBg ? "rgba(255,255,255,0.05)" : "transparent",
        backdropFilter: showBg ? "blur(24px)" : "none",
        WebkitBackdropFilter: showBg ? "blur(24px)" : "none",
      }}
    >
      <div className="flex justify-between items-center">
        <a href="/" className="relative flex items-center" style={{ width: 80, height: 21 }}>
          <Image
            src="/wordmark-dark.svg"
            alt="Candid"
            width={80}
            height={21}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: showWhite ? 0 : 1 }}
            priority
          />
          <Image
            src="/wordmark-white.svg"
            alt="Candid"
            width={80}
            height={21}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: showWhite ? 1 : 0 }}
            priority
          />
        </a>
        {rightElement ?? (
          <span className="cursor-default">
            <Image
              src="/download.svg"
              alt="Download on the App Store"
              width={120}
              height={40}
              priority
            />
          </span>
        )}
      </div>
    </nav>
  );
}
