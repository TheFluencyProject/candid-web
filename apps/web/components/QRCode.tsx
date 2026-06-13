"use client";

import { QRCodeSVG } from "qrcode.react";

const BASE_URL = "https://joincandid.co";

// Encodes the plain App Clip invocation URL (NOT an Apple App Clip Code) so iPhone Camera
// scans surface the clip card, while Android/old-iOS scanners just open the URL → App Store.
export default function QRCode({ slug, lesson, label }: { slug: string; lesson?: string; label?: string }) {
  const url = `${BASE_URL}/download/${slug}${lesson ? `?lesson=${encodeURIComponent(lesson)}` : ""}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl bg-white p-4">
        <QRCodeSVG value={url} size={196} />
      </div>
      {label && <p className="text-sm" style={{ color: "#666666" }}>{label}</p>}
    </div>
  );
}
