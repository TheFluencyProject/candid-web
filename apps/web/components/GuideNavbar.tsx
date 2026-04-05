"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function GuideNavbar({
  sentinelId,
  downloadUrl,
}: {
  sentinelId: string;
  downloadUrl: string;
}) {
  const [pastHero, setPastHero] = useState(false);

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-3 bg-white/5 backdrop-blur-xl" style={{ height: "var(--navbar-height, 64px)" }}>
      <div className="flex justify-between items-center">
        <a href="/" className="relative flex items-center" style={{ width: 80, height: 21 }}>
          <Image
            src="/wordmark-dark.svg"
            alt="Candid"
            width={80}
            height={21}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: pastHero ? 0 : 1 }}
            priority
          />
          <Image
            src="/wordmark-white.svg"
            alt="Candid"
            width={80}
            height={21}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: pastHero ? 1 : 0 }}
            priority
          />
        </a>
        <a
          href={downloadUrl}
          className="hover:opacity-90 transition-opacity"
        >
          <Image
            src="/download.svg"
            alt="Download on the App Store"
            width={120}
            height={40}
            priority
          />
        </a>
      </div>
    </nav>
  );
}
