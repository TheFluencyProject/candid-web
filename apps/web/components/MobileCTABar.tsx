"use client";

import { useState, useEffect } from "react";
const DEFAULT_URL = "/download";

function isTikTokOrInstagram(): boolean {
  if (typeof navigator === "undefined") return false;
  return /TikTok|BytedanceWebview|musical_ly|Instagram/i.test(navigator.userAgent);
}

export default function MobileCTABar({ downloadUrl, ctaLabel, ctaSubtext }: { downloadUrl?: string; ctaLabel?: string; ctaSubtext?: string }) {
  const href = downloadUrl ?? DEFAULT_URL;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isTikTokOrInstagram()) {
      setVisible(true);
      document.documentElement.style.setProperty("--mobile-cta-offset", "64px");
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div
        className="pt-12 px-6 flex flex-col items-center pointer-events-auto"
        style={{
          background: "linear-gradient(to top, #18181C 60%, transparent 100%)",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <a
          href={href}
          className="w-full max-w-sm py-4 rounded-full text-center text-lg font-bold tracking-wide block"
          style={{ backgroundColor: "#89FFB4", color: "#000000" }}
        >
          {ctaLabel ?? "GET STARTED FOR FREE"}
        </a>
        {/*
        <p
          className="mt-2 text-sm font-medium"
          style={{ color: "#89FFB4" }}
        >
          {ctaSubtext ?? "No Credit Card Required"}
        </p>
        */}
      </div>
    </div>
  );
}
