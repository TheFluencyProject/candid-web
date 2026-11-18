"use client";

import { useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

// desktop-qr-card's "card" arm (plan lesson-page-qr-card-2026-11-18): instead of the centred blur popup, the desktop QR
// floats in the bottom-right corner and stays — no X, no dismiss. The coin bubble's dark glass, the code in white right
// on it, the title in the page's Study colour, a faint line of that colour slowly circling the edge. The rest of the
// page dims 25% but still scrolls and clicks (the dim layer takes no pointer events). A repeat Study press makes it hop.
// Desktop only (CSS); DownloadQRInterceptor only shows a QR at ≥ 1024 px anyway.
export default function QRCard({ url, shows, title, color }: {
  // null until the first Study press: nothing shows before then.
  url: string | null;
  // Study presses so far; each one after the first hops the card.
  shows: number;
  title: string;
  color: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  // While the card is up, the path's first coin stops pulsing (globals.css): one moving thing at a time.
  useEffect(() => {
    if (!url) return;
    document.documentElement.dataset.qrCard = "up";
  }, [url]);

  useEffect(() => {
    if (shows < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cardRef.current?.animate(
      [{ transform: "none" }, { transform: "translateY(-12px) scale(1.03)", offset: 0.35 }, { transform: "none" }],
      { duration: 500, easing: "cubic-bezier(.3, 1.6, .5, 1)" },
    );
  }, [shows]);

  return (
    <div className={`qrc-root${url ? " qrc-on" : ""}`} style={{ ["--qrc" as string]: color }} aria-hidden={!url}>
      <div className="qrc-dim" />
      <div ref={cardRef} className="qrc" role={url ? "dialog" : undefined} aria-label={url ? title : undefined}>
        <div className="qrc-code">
          {/* White squares straight on the dark card; the card's padding is the quiet zone. */}
          {url && <QRCodeSVG value={url} size={188} fgColor="#FFFFFF" bgColor="transparent" level="M" />}
        </div>
        <b className="qrc-title">{title}</b>
      </div>
    </div>
  );
}
