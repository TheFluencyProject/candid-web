"use client";

import { QRCodeSVG } from "qrcode.react";

const BASE_URL = "https://joincandid.co";

export default function QRCode({ slug, label }: { slug: string; label?: string }) {
  const url = `${BASE_URL}/download/${slug}`;

  // Temporarily disabled
  return null;
}
