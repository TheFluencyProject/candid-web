// The App Store button (same as the hero's), for the sections further down the page (Adam 11/17).
// Plain <a>: /download is a middleware redirect that only matches unprefixed, so a /ko/download href would 404.
// `color` sets the button's color (fill + 3D lip); without it the button takes --cta from its parent, else mint.
export default function DownloadCta({ label, tracking, className = "", color }: { label: string; tracking: string; className?: string; color?: string }) {
  return (
    <a
      href="/download"
      style={color ? ({ "--cta": color } as React.CSSProperties) : undefined}
      className={`inline-block rounded-full px-8 py-2.5 md:py-3 text-base font-semibold ${tracking} text-[#18181C] hover:opacity-90 cta-3d ${className}`}
    >
      {label}
    </a>
  );
}
