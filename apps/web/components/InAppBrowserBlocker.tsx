"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { isRestrictedInAppBrowser } from "@/lib/platform";

export default function InAppBrowserBlocker() {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback((e: MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") ?? "";
    if (!href.startsWith("/download")) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!isRestrictedInAppBrowser()) return;
    // capture: true so we fire before Next.js <Link> bubbling handlers
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [handleClick]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black px-8"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <button
        onClick={() => setOpen(false)}
        className="absolute top-4 right-4 text-white/60 hover:text-white p-2"
        style={{ marginTop: "env(safe-area-inset-top)" }}
        aria-label="Close"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <h2 className="text-2xl font-bold text-white text-center mb-1">
        Search &ldquo;Candid fluency&rdquo;
      </h2>
      <p className="text-2xl font-bold text-white text-center mb-2">
        in the App Store :)
      </p>

      <div className="mb-8" />
      <Image
        src="/appstore-search.png"
        alt="Search Candid Fluency on the App Store"
        width={500}
        height={600}
        className="w-full max-w-md rounded-2xl"
        priority
      />
    </div>
  );
}
