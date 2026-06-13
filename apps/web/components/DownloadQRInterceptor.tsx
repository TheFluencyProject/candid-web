"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import ResponsiveOverlay from "@/components/ResponsiveOverlay";
import { APP_STORE_URL } from "@/lib/platform";

const BASE_URL = "https://joincandid.co";

// Universal desktop behavior for every "/download…" link on the marketing site: a desktop user can't
// install an iOS app, so instead of navigating we pop a QR of that exact link (any tutor slug + lesson
// params ride along in the href) to scan with an iPhone → App Clip card. Mobile/tablet clicks fall
// through and navigate normally (→ App Clip on iOS 18+, App Store otherwise).
//
// Capture-phase document listener mirrors InAppBrowserBlocker; the two never overlap — that one only
// runs in restricted in-app browsers, this one only on desktop (≥1024px). Links can set
// data-tutor-name to personalize the heading.
export default function DownloadQRInterceptor() {
  const t = useTranslations("tutor");
  const [target, setTarget] = useState<{ url: string; tutorName: string | null } | null>(null);

  const handleClick = useCallback((e: MouseEvent) => {
    // Leave new-tab / modified / non-primary clicks alone.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const anchor = (e.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href") ?? "";
    if (!href.startsWith("/download")) return;
    e.preventDefault();
    e.stopPropagation();
    setTarget({ url: `${BASE_URL}${href}`, tutorName: anchor?.getAttribute("data-tutor-name") || null });
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [handleClick]);

  return (
    <ResponsiveOverlay open={target !== null} onClose={() => setTarget(null)} blurBackdrop panelBackground="#FFFFFF">
      {target && (
        <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
          <h2 className="text-2xl font-semibold" style={{ color: "#18181C" }}>
            {target.tutorName ? t("start_with_name", { name: target.tutorName }) : t("start_with_candid")}
          </h2>
          <div className="rounded-2xl bg-white p-4">
            <QRCodeSVG value={target.url} size={196} />
          </div>
          <a href={APP_STORE_URL} className="text-sm underline" style={{ color: "#666666" }}>
            {t("or_app_store")}
          </a>
        </div>
      )}
    </ResponsiveOverlay>
  );
}
