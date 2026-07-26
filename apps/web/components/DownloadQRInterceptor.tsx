"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import ResponsiveOverlay from "@/components/ResponsiveOverlay";

const BASE_URL = "https://joincandid.co";

// Universal desktop behavior for every "/download…" link on the marketing site: a desktop user can't
// install an iOS app, so instead of navigating we pop a QR of that exact link (any tutor slug + lesson
// params ride along in the href) to scan with an iPhone → App Clip card. Mobile/tablet clicks fall
// through and navigate normally (→ App Clip on iOS 18+, App Store otherwise).
//
// Capture-phase document listener mirrors InAppBrowserBlocker; the two never overlap — that one only
// runs in restricted in-app browsers, this one only on desktop (≥1024px).
//
// `label` is passed in rather than read from next-intl: /lesson/[id] lives outside the [locale] group
// (no translation context there) and mounts this with its own local copy map.
export default function DownloadQRInterceptor({ label }: { label: string }) {
  const [target, setTarget] = useState<{ url: string } | null>(null);

  const handleClick = useCallback((e: MouseEvent) => {
    // Leave new-tab / modified / non-primary clicks alone.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const anchor = (e.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href") ?? "";
    if (!href.startsWith("/download")) return;
    e.preventDefault();
    e.stopPropagation();
    setTarget({ url: `${BASE_URL}${href}` });
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [handleClick]);

  return (
    <ResponsiveOverlay
      open={target !== null}
      onClose={() => setTarget(null)}
      blurBackdrop
      panelBackground="#FFFFFF"
      desktopMaxWidthClass="max-w-[340px]"
    >
      {target && (
        <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
          <h2 className="text-xl font-semibold" style={{ color: "#18181C" }}>
            {label}
          </h2>
          <div className="rounded-2xl bg-white p-4">
            <QRCodeSVG value={target.url} size={196} />
          </div>
        </div>
      )}
    </ResponsiveOverlay>
  );
}
