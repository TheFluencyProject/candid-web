"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ResponsiveOverlay from "@/components/ResponsiveOverlay";
import QRCode from "@/components/QRCode";
import { APP_STORE_URL } from "@/lib/platform";

interface Props {
  slug: string;
  tutorName: string;
  lesson?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

// Desktop tutor-page download CTAs open a "scan to install" QR overlay — a desktop user can't
// install an iOS app, so they scan with their iPhone and land on the App Clip card. Below lg the
// link just navigates to /download/<slug> (→ App Clip card on iOS 18+, App Store otherwise).
export default function DownloadCTA({ slug, tutorName, lesson, className, style, children }: Props) {
  const t = useTranslations("tutor");
  const [open, setOpen] = useState(false);
  const href = `/download/${slug}${lesson ? `?lesson=${encodeURIComponent(lesson)}` : ""}`;

  return (
    <>
      <a
        href={href}
        className={className}
        style={style}
        onClick={(e) => {
          // Desktop (≥lg) → QR overlay; smaller viewports follow the link normally.
          if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {children}
      </a>
      <ResponsiveOverlay open={open} onClose={() => setOpen(false)} blurBackdrop>
        <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
          <h2 className="text-2xl font-semibold" style={{ color: "#18181C" }}>
            {t("scan_to_join", { name: tutorName })}
          </h2>
          <QRCode slug={slug} lesson={lesson} />
          <a href={APP_STORE_URL} className="text-sm underline" style={{ color: "#666666" }}>
            {t("or_app_store")}
          </a>
        </div>
      </ResponsiveOverlay>
    </>
  );
}
