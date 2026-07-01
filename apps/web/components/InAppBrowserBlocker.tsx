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

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Broadcast open/close so the hero marquee freezes its videos while this modal is up.
  // In restricted in-app browsers (TikTok) the marquee's inline videos ignore playsInline and
  // auto-fullscreen; left drifting behind the modal they keep re-fullscreening and poke out at
  // the bottom of the screen. The marquee listens for this and pauses playback + drift.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("candid:inapp-blocker", { detail: open }));
  }, [open]);

  return (
    <>
      {/* Preload image so it renders instantly when modal opens */}
      <link rel="preload" as="image" href="/appstore-search.png" />

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black px-8"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          onClick={() => setOpen(false)}
        >
          <h2 className="text-2xl font-bold text-white text-center mb-1">
            Search &ldquo;Candid Korean&rdquo;
          </h2>
          <p className="text-2xl font-bold text-white text-center mb-2">
            in the App Store :)
          </p>

          <div className="mb-8" />
          <Image
            src="/appstore-search.png"
            alt="Search Candid Korean on the App Store"
            width={500}
            height={600}
            className="w-full max-w-md rounded-2xl"
            priority
          />
        </div>
      )}
    </>
  );
}
