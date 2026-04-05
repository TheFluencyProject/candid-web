"use client";

const DEFAULT_URL = "/download";

export default function MobileCTABar({ downloadUrl, ctaLabel, ctaSubtext }: { downloadUrl?: string; ctaLabel?: string; ctaSubtext?: string }) {
  const href = downloadUrl ?? DEFAULT_URL;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
      <div
        className="pt-12 pb-6 px-6 flex flex-col items-center pointer-events-auto"
        style={{
          background: "linear-gradient(to top, #131212 60%, transparent 100%)",
        }}
      >
        <a
          href={href}
          className="w-full max-w-sm py-4 rounded-full text-center text-lg font-bold tracking-wide transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#89FFB4", color: "#000000" }}
        >
          {ctaLabel ?? "GET STARTED FOR FREE"}
        </a>
        <p
          className="mt-2 text-xs font-medium"
          style={{ color: "#89FFB4" }}
        >
          {ctaSubtext ?? "No Credit Card Required"}
        </p>
      </div>
    </div>
  );
}
