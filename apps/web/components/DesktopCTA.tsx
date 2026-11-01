"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { QRCodeSVG } from "qrcode.react";
import type { AndroidWaitlistSurface } from "@/lib/api";
import { DESKTOP_CTA_FLAG_KEY, type DesktopCtaVariant } from "@/lib/posthog-config";
import { buildQrUrl } from "@/lib/qr-url";

const MINT = "#89FFB4";
const SQUARE_PX = 200;
const QR_PX = 112;
// QR + gap + one label line, centred as a block so the top and bottom margins match.
const LABEL_LINE_PX = 24;
const QR_LABEL_GAP_PX = 14;
const PAD_PX = (SQUARE_PX - QR_PX - QR_LABEL_GAP_PX - LABEL_LINE_PX) / 2;
// inline arm: a white QR straight on the dark page, no card.
const INLINE_QR_PX = 140;
const MORPH_MS = 350;

type Props = {
  href: string;
  label: string;
  scanLabel: string;
  tutorSlug: string;
  lessonId?: string | null;
  surface: AndroidWaitlistSurface;
  // Resolved server-side (flag or the preview ?cta= override). Undefined = not in the test
  // (non-en): the control pill, and no exposure.
  variant?: DesktopCtaVariant;
  // candid_did, known at SSR — so the inline QR renders server-side with the real sid.
  distinctId: string;
};

// Desktop hero CTA A/B (desktop-cta-qr): control = the pill whose click the DownloadQRInterceptor
// turns into a QR modal; morph = the pill grows in place into the QR; inline = a white QR on the
// page from first paint, with a ☝️ and the label in mint under it. Below lg (1024px, the interceptor's gate) every arm is the plain /download anchor —
// switched in CSS rather than after a matchMedia effect, so neither side flashes the other's CTA.
export default function DesktopCTA({ href, label, scanLabel, tutorSlug, lessonId = null, surface, variant, distinctId }: Props) {
  const arm: DesktopCtaVariant = variant ?? "control";
  const qrUrl = buildQrUrl({ tutor_slug: tutorSlug, surface, sid: distinctId, lesson_id: lessonId, variant: arm });
  const exposed = useRef(false);

  // Manual exposure: server-decide + client bootstrap skip the SDK's auto-tracking (see
  // MobileCTABar). Desktop only — mobile never sees the arms. Deferred one task: this child effect
  // runs before PostHogProvider's posthog.init effect, and a capture before init is dropped.
  useEffect(() => {
    if (!variant || exposed.current || !window.matchMedia("(min-width: 1024px)").matches) return;
    exposed.current = true;
    setTimeout(() => {
      posthog.capture("$feature_flag_called", {
        $feature_flag: DESKTOP_CTA_FLAG_KEY,
        $feature_flag_response: variant,
      });
    }, 0);
  }, [variant]);

  const pill = (className: string, ctaVariant?: DesktopCtaVariant) => (
    <a
      href={href}
      data-cta-variant={ctaVariant}
      className={`${className} px-12 py-3.5 rounded-full text-base font-bold`}
      style={{ backgroundColor: MINT, color: "#000000" }}
    >
      {label}
    </a>
  );

  if (arm === "control") return pill("inline-block", variant);

  return (
    <>
      {pill("inline-block lg:hidden")}
      {arm === "inline" ? (
        // Nudged in from the tutor hero's text edge; the lesson page centres it, so no offset there.
        <div className={`hidden lg:inline-flex flex-col items-center align-top ${surface === "tutor" ? "lg:ml-8" : ""}`}>
          <QRCodeSVG value={qrUrl} size={INLINE_QR_PX} fgColor="#FFFFFF" bgColor="transparent" />
          <span aria-hidden className="mt-4 text-xl leading-none">☝️</span>
          <span className="mt-2 text-base font-bold whitespace-nowrap" style={{ color: MINT }}>
            {label}
          </span>
        </div>
      ) : (
        <MorphButton label={label} scanLabel={scanLabel} qrUrl={qrUrl} tutorSlug={tutorSlug} lessonId={lessonId} surface={surface} />
      )}
    </>
  );
}

function MorphButton({ label, scanLabel, qrUrl, tutorSlug, lessonId, surface }: {
  label: string;
  scanLabel: string;
  qrUrl: string;
  tutorSlug: string;
  lessonId: string | null;
  surface: AndroidWaitlistSurface;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  // pill → start (explicit pill size, so width/height can transition from it) → square.
  const [phase, setPhase] = useState<"pill" | "start" | "square">("pill");
  const [from, setFrom] = useState<{ w: number; h: number } | null>(null);
  const [animate, setAnimate] = useState(true);

  useLayoutEffect(() => {
    if (phase !== "start") return;
    // Reading layout flushes the pill-sized box as the transition's starting point, then the
    // square size transitions from it — no animation frame needed.
    void ref.current!.offsetWidth;
    setPhase("square");
  }, [phase]);

  const onClick = () => {
    if (phase !== "pill") return;
    posthog.capture("study_cta_clicked", {
      surface,
      tutor_slug: tutorSlug,
      lesson_id: lessonId,
      mode: "qr_inline",
    });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimate(false);
      setPhase("square");
      return;
    }
    const rect = ref.current!.getBoundingClientRect();
    setFrom({ w: rect.width, h: rect.height });
    setPhase("start");
  };

  const square = phase === "square";
  const style: React.CSSProperties = { backgroundColor: MINT, color: "#000000" };
  if (phase !== "pill") {
    Object.assign(style, {
      width: square ? SQUARE_PX : from!.w,
      height: square ? SQUARE_PX : from!.h,
      // Half the pill height, not 9999px: from 9999 the corners only square up in the last frames.
      borderRadius: square ? 24 : from!.h / 2,
      transition: animate ? `width ${MORPH_MS}ms ease-out, height ${MORPH_MS}ms ease-out, border-radius ${MORPH_MS}ms ease-out` : undefined,
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`hidden lg:inline-block relative overflow-hidden text-base font-bold ${
        phase === "pill" ? "px-12 py-3.5 rounded-full" : "cursor-default align-top"
      }`}
      style={style}
    >
      {phase === "pill" ? (
        label
      ) : (
        <>
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: PAD_PX,
              opacity: square ? 1 : 0,
              transition: animate ? `opacity ${MORPH_MS}ms ease-out ${MORPH_MS / 2}ms` : undefined,
            }}
          >
            <QRCodeSVG value={qrUrl} size={QR_PX} fgColor="#000000" bgColor="transparent" />
          </div>
          {/* Slides from the pill's centre line down to the bottom edge. */}
          <span
            className="absolute inset-x-0 text-center whitespace-nowrap"
            style={{
              bottom: square ? PAD_PX : "50%",
              lineHeight: `${LABEL_LINE_PX}px`,
              transform: square ? undefined : "translateY(50%)",
              transition: animate ? `bottom ${MORPH_MS}ms ease-out, transform ${MORPH_MS}ms ease-out` : undefined,
            }}
          >
            {square ? scanLabel : label}
          </span>
        </>
      )}
    </button>
  );
}
