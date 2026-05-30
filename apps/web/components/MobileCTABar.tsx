"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import posthog from "posthog-js";
import { CTA_FLAG_KEY, type MobileCtaVariant } from "@/lib/posthog-config";
import { openJoinForFree } from "@/lib/join-for-free-store";

const DEFAULT_URL = "/download";

// i18n keys, not literal strings — single source of truth lives in messages/*.json.
const CTA_VARIANTS = {
  control: { labelKey: "get_started", subtextKey: "no_credit_card" },
  download_app: { labelKey: "get_the_app", subtextKey: "free_trial" },
} as const;

function isTikTokOrInstagram(): boolean {
  if (typeof navigator === "undefined") return false;
  return /TikTok|BytedanceWebview|musical_ly|Instagram/i.test(navigator.userAgent);
}

type Props = {
  downloadUrl?: string;
  ctaLabel?: string;
  ctaSubtext?: string;
  // Resolved server-side and passed in so first paint matches the bootstrapped client SDK (no flash).
  ctaVariant?: MobileCtaVariant;
  // 'join' opens the Join-for-free sheet instead of routing to the App Store.
  // Default 'download' keeps the existing behavior for the home page + joincandid.co.
  mode?: "download" | "join";
  // Force the bar visible on first paint regardless of scroll position. Used by
  // high-intent landing surfaces like the ?v=meta ad variant where waiting for
  // scroll would hide the CTA above the fold.
  alwaysVisible?: boolean;
};

export default function MobileCTABar({ downloadUrl, ctaLabel, ctaSubtext, ctaVariant, mode = "download", alwaysVisible = false }: Props) {
  const href = downloadUrl ?? DEFAULT_URL;
  const locale = useLocale();
  const t = useTranslations("tutor");
  // Initial state matches alwaysVisible so meta-variant first paint shows the bar (no flash).
  const [visible, setVisible] = useState(alwaysVisible);

  const isPinned = Boolean(ctaLabel || ctaSubtext);
  const isKoreanTest = !isPinned && locale === "ko";
  const activeVariant: MobileCtaVariant = ctaVariant ?? "control";

  useEffect(() => {
    if (alwaysVisible || isTikTokOrInstagram()) {
      setVisible(true);
      document.documentElement.style.setProperty("--mobile-cta-offset", "64px");
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [alwaysVisible]);

  // Manual exposure: server-decide + client bootstrap skip the SDK's auto-tracking,
  // so the experiment dashboard needs us to record the variant ourselves.
  useEffect(() => {
    if (isPinned || isKoreanTest || !ctaVariant) return;
    posthog.capture("$feature_flag_called", {
      $feature_flag: CTA_FLAG_KEY,
      $feature_flag_response: ctaVariant,
    });
  }, [isPinned, isKoreanTest, ctaVariant]);

  let resolvedLabel: string;
  let resolvedSubtext: string;
  let trackedVariant: string;
  if (isPinned) {
    resolvedLabel = ctaLabel ?? t("get_started");
    resolvedSubtext = ctaSubtext ?? t("no_credit_card");
    trackedVariant = "override";
  } else if (isKoreanTest) {
    resolvedLabel = t("get_started");
    resolvedSubtext = t("no_credit_card");
    trackedVariant = "ko_fixed";
  } else {
    resolvedLabel = t(CTA_VARIANTS[activeVariant].labelKey);
    resolvedSubtext = t(CTA_VARIANTS[activeVariant].subtextKey);
    trackedVariant = activeVariant;
  }

  const handleClick = (e?: React.MouseEvent) => {
    posthog.capture("mobile_cta_clicked", {
      variant: trackedVariant,
      label: resolvedLabel,
      subtext: resolvedSubtext,
      mode,
    });
    if (mode === "join") {
      // Open the Join-for-free sheet instead of navigating to the App Store.
      e?.preventDefault();
      openJoinForFree();
    }
  };

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
        {mode === "join" ? (
          <button
            type="button"
            onClick={handleClick}
            className="w-full max-w-sm py-4 rounded-full text-center text-lg font-bold tracking-wide block"
            style={{ backgroundColor: "#89FFB4", color: "#000000" }}
          >
            {resolvedLabel}
          </button>
        ) : (
          <a
            href={href}
            onClick={handleClick}
            className="w-full max-w-sm py-4 rounded-full text-center text-lg font-bold tracking-wide block"
            style={{ backgroundColor: "#89FFB4", color: "#000000" }}
          >
            {resolvedLabel}
          </a>
        )}
        <p
          className="mt-2 text-sm font-medium"
          style={{ color: "#89FFB4" }}
        >
          {resolvedSubtext}
        </p>
      </div>
    </div>
  );
}
