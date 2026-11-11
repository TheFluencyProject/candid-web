"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Fixed top bar (wordmark + Try for free) that slides in once the hero's own CTA
// (#hero-cta) has scrolled off screen, so a download button is always one tap away.
export default function ScrollNav({ ctaLabel, tracking }: { ctaLabel: string; tracking: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const cta = document.getElementById("hero-cta");
    if (!cta) return;
    // Show only once the CTA is above the viewport (not while it's still below on load).
    const obs = new IntersectionObserver(([e]) => setShown(!e.isIntersecting && e.boundingClientRect.top < 0));
    obs.observe(cta);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-30 border-b border-white/[0.06] bg-[#18181C]/80 backdrop-blur-xl transition-transform duration-300 ${
        shown ? "translate-y-0" : "-translate-y-full"
      }`}
      aria-hidden={!shown}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        <a href="/" tabIndex={shown ? 0 : -1} className="hover:opacity-80 transition-opacity">
          <Image src="/wordmark-white.svg" alt="Candid" width={80} height={21} />
        </a>
        {/* Plain <a> to /download, same as the hero CTA (middleware redirect, unprefixed only). */}
        <a
          href="/download"
          tabIndex={shown ? 0 : -1}
          className={`rounded-full bg-[#89FFB4] px-5 py-2 text-sm font-semibold ${tracking} text-[#18181C] hover:opacity-90 transition-opacity`}
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
