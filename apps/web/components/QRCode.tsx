"use client";

import { QRCodeSVG } from "qrcode.react";

const BASE_URL = "https://joincandid.co";

export default function QRCode({ slug, label }: { slug: string; label?: string }) {
  const url = `${BASE_URL}/download/${slug}`;

  return (
    <div className="flex flex-col items-center">
      <div>
        <QRCodeSVG value={url} size={100} level="M" bgColor="transparent" />
      </div>
      <p
        className="mt-3 text-sm font-bold"
        style={{ color: "#131212" }}
      >
        {label ?? "Download & Try for Free"}
      </p>
    </div>
  );
}
