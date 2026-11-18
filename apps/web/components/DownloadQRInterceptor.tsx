"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import posthog from "posthog-js";
import { QRCodeSVG } from "qrcode.react";
import ResponsiveOverlay from "@/components/ResponsiveOverlay";
import AndroidWaitlistOverlay, { type AndroidWaitlistTarget } from "@/components/AndroidWaitlistOverlay";
import type { AndroidWaitlistSurface } from "@/lib/api";
import { isAndroid } from "@/lib/in-app-browser";
import { buildQrUrl } from "@/lib/qr-url";
import { QR_CARD_FLAG_KEY, QR_CARD_ARMS, type DesktopCtaVariant, type QrCardVariant } from "@/lib/posthog-config";
import QRCard from "@/components/QRCard";

// Which page the click happened on, for the funnel. Custom-domain tutor pages rewrite server-side
// so their pathname is "/" — they render join-sheet buttons, not /download anchors, so they never
// reach this in practice.
function describePage(pathname: string): { surface: AndroidWaitlistSurface; lesson_id: string | null } {
  const lesson = pathname.match(/^\/lesson\/([^/]+)/);
  if (lesson) return { surface: "lesson", lesson_id: lesson[1] };
  if (/^(?:\/[a-z]{2})?\/tutor\//.test(pathname)) return { surface: "tutor", lesson_id: null };
  return { surface: "site", lesson_id: null };
}

// Universal desktop behavior for every "/download…" link on the marketing site: a desktop user can't
// install an iOS app, so instead of navigating we pop a QR to scan with an iPhone. Android can't
// install it either, so Android taps (any width) get the waitlist overlay instead. iPhone/iPad
// clicks fall through and navigate normally.
//
// The QR encodes /qr/<slug>, NOT the /download link itself (see lib/qr-url).
//
// Capture-phase document listener mirrors InAppBrowserBlocker; the two never overlap — that one only
// runs in restricted in-app browsers, this one only on desktop (≥1024px). Click tracking happens
// before the desktop gate, so mobile taps are tracked too and then navigate.
//
// `label` is passed in rather than read from next-intl: /lesson/[id] lives outside the [locale] group
// (no translation context there) and mounts this with its own local copy map.
//
// `qrArm` = this visitor's desktop-qr-card arm (unset = not in the test: the lesson page's old hero): "card" shows
// QRCard in `cardColor` instead of the popup. Either arm records the test's exposure the first time its QR shows, so
// only desktop visitors who got a QR from a Study / Download tap count, and its scans carry the arm (`u`, →
// qr_scanned.qr_ui). On local + previews, ?qr=card|control forces the arm (the [locale] layout can't read the query).
export default function DownloadQRInterceptor({ label, qrArm: assignedArm, cardColor = "#89FFB4" }: {
  label: string;
  qrArm?: QrCardVariant;
  cardColor?: string;
}) {
  const [qrArm, setQrArm] = useState(assignedArm);
  useEffect(() => {
    if (!assignedArm || process.env.NEXT_PUBLIC_VERCEL_ENV === "production") return;
    const forced = QR_CARD_ARMS.find((arm) => arm === new URLSearchParams(window.location.search).get("qr"));
    if (forced) setQrArm(forced);
  }, [assignedArm]);
  // `shows` counts this page's QR shows: the card hops on each one after the first.
  const [target, setTarget] = useState<{ url: string; shows: number } | null>(null);
  const [waitlist, setWaitlist] = useState<AndroidWaitlistTarget | null>(null);
  const exposed = useRef(false);

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
    const android = isAndroid();
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const showQR = isDownload && isDesktop && !android;

    posthog.capture("study_cta_clicked", {
      surface,
      tutor_slug,
      lesson_id,
      href,
      mode: android ? "android_waitlist" : showQR ? "qr" : "navigate",
    });

    if (android) {
      e.preventDefault();
      e.stopPropagation();
      setWaitlist({ tutor_slug, surface });
      return;
    }

    if (!showQR) return;
    e.preventDefault();
    e.stopPropagation();

    // Undefined before posthog.init resolves — buildQrUrl omits it rather than baking "undefined" in.
    const sid = posthog.get_distinct_id();
    // DesktopCTA's control arm marks its anchor so the modal's scans carry the arm too.
    const variant = (anchor?.dataset.ctaVariant as DesktopCtaVariant | undefined) ?? null;
    const ui = qrArm === "card" ? "card" : qrArm ? "modal" : null;
    const url = buildQrUrl({ tutor_slug, surface, sid, lesson_id, variant, ui });
    setTarget((t) => ({ url, shows: (t?.shows ?? 0) + 1 }));
    if (qrArm && !exposed.current) {
      exposed.current = true;
      posthog.capture("$feature_flag_called", { $feature_flag: QR_CARD_FLAG_KEY, $feature_flag_response: qrArm });
    }
    // The card takes over from the path's coin bubble (LessonPagePath closes it), the bubble's own Study included.
    if (qrArm === "card") window.dispatchEvent(new Event("candid:qr-card"));
  }, [qrArm]);

  useEffect(() => {
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [handleClick]);

  // Android store hops (middleware's storeRedirect: a scanned QR, /download/<slug>, /app…) land here
  // with ?waitlist=<tutor slug | 1>&from=<link>. Open the same form an Android tap opens, and drop the
  // params so a refresh or a share doesn't reopen it. Runs before PostHogProvider's init (child effects
  // run first), so the replaceState fires no extra pageview and the capture waits one task.
  useEffect(() => {
    const url = new URL(window.location.href);
    const slug = url.searchParams.get("waitlist");
    if (slug === null || !isAndroid()) return;
    const from = url.searchParams.get("from") ?? "unknown";
    url.searchParams.delete("waitlist");
    url.searchParams.delete("from");
    window.history.replaceState(window.history.state, "", url);

    const { surface, lesson_id } = describePage(window.location.pathname);
    const tutor_slug = slug === "1" ? "" : slug;
    setTimeout(() => posthog.capture("android_waitlist_opened", { from, surface, tutor_slug, lesson_id }), 0);
    setWaitlist({ tutor_slug, surface, from });
  }, []);

  return (
    <>
      <AndroidWaitlistOverlay target={waitlist} onClose={() => setWaitlist(null)} />
      {qrArm === "card" ? (
        <QRCard url={target?.url ?? null} shows={target?.shows ?? 0} title={label} color={cardColor} />
      ) : (
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
              {/* Where the scan goes, in words. Plain text: the QR's own /qr link is the tracked one,
                  and both end in the same place (App Store on iPhone, our waitlist on Android). */}
              <p className="-mt-3 text-sm font-medium" style={{ color: "#6B6B70" }}>
                joincandid.co/app
              </p>
            </div>
          )}
        </ResponsiveOverlay>
      )}
    </>
  );
}
