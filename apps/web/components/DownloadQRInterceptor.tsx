"use client";

import { useState, useEffect, useCallback } from "react";
import posthog from "posthog-js";
import { QRCodeSVG } from "qrcode.react";
import ResponsiveOverlay from "@/components/ResponsiveOverlay";

const BASE_URL = "https://joincandid.co";

// Which page the click happened on, for the funnel. Custom-domain tutor pages rewrite server-side
// so their pathname is "/" — they render join-sheet buttons, not /download anchors, so they never
// reach this in practice.
function describePage(pathname: string): { surface: string; lesson_id: string | null } {
  const lesson = pathname.match(/^\/lesson\/([^/]+)/);
  if (lesson) return { surface: "lesson", lesson_id: lesson[1] };
  if (/^(?:\/(?:en|ko))?\/tutor\//.test(pathname)) return { surface: "tutor", lesson_id: null };
  return { surface: "site", lesson_id: null };
}

// Universal desktop behavior for every "/download…" link on the marketing site: a desktop user can't
// install an iOS app, so instead of navigating we pop a QR to scan with an iPhone. Mobile/tablet
// clicks fall through and navigate normally.
//
// The QR encodes /qr/<slug>, NOT the /download link itself — /download is a registered App Clip
// Experience, so scanning it pops the clip card before the redirect can run. /qr is unregistered
// (goes straight to the tutor's App Store page) and lets middleware record the scan.
// The App Clip funnel used `${BASE_URL}${href}` here; restore that if it's ever re-enabled.
//
// Capture-phase document listener mirrors InAppBrowserBlocker; the two never overlap — that one only
// runs in restricted in-app browsers, this one only on desktop (≥1024px). Click tracking happens
// before the desktop gate, so mobile taps are tracked too and then navigate.
//
// `label` is passed in rather than read from next-intl: /lesson/[id] lives outside the [locale] group
// (no translation context there) and mounts this with its own local copy map.
export default function DownloadQRInterceptor({ label }: { label: string }) {
  const [target, setTarget] = useState<{ url: string } | null>(null);

  const handleClick = useCallback((e: MouseEvent) => {
    // Leave new-tab / modified / non-primary clicks alone.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = (e.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href") ?? "";
    const isDownload = href.startsWith("/download");
    if (!isDownload) return;

    const { surface, lesson_id } = describePage(window.location.pathname);
    // The lesson page's CTA carries ?l=<lesson_id>; split it off or it lands in the slug.
    const tutor_slug = href.slice("/download/".length).split("?")[0];
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const showQR = isDownload && isDesktop;

    posthog.capture("study_cta_clicked", {
      surface,
      tutor_slug,
      lesson_id,
      href,
      mode: showQR ? "qr" : "navigate",
    });

    if (!showQR) return;
    e.preventDefault();
    e.stopPropagation();

    // Undefined before posthog.init resolves — omit rather than bake "undefined" into the QR.
    const sid = posthog.get_distinct_id();
    const params = new URLSearchParams({ s: surface });
    if (sid) params.set("sid", sid);
    if (lesson_id) params.set("l", lesson_id);
    // No trailing slash on the bare form — Next 308s "/qr/" to "/qr" before middleware runs.
    const path = tutor_slug ? `/qr/${tutor_slug}` : "/qr";
    setTarget({ url: `${BASE_URL}${path}?${params}` });
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
