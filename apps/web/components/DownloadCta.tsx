// The green App Store button (same as the hero's), for the sections further down the page (Adam 11/17).
// Plain <a>: /download is a middleware redirect that only matches unprefixed, so a /ko/download href would 404.
export default function DownloadCta({ label, tracking, className = "" }: { label: string; tracking: string; className?: string }) {
  return (
    <a
      href="/download"
      className={`inline-block rounded-full bg-[#89FFB4] px-8 py-2.5 md:py-3 text-base font-semibold ${tracking} text-[#18181C] hover:opacity-90 cta-3d ${className}`}
    >
      {label}
    </a>
  );
}
