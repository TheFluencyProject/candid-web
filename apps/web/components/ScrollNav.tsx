import Image from "next/image";

// Fixed top bar (wordmark + Try for free), visible from the first frame (Adam 11/17: it used to slide in only
// once the hero's own CTA had scrolled off), so a download button is always one tap away.
export default function ScrollNav({ ctaLabel, tracking }: { ctaLabel: string; tracking: string }) {
  return (
    <div className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.06] bg-[#18181C]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        <a href="/" className="hover:opacity-80 transition-opacity">
          <Image src="/wordmark-white.svg" alt="Candid" width={80} height={21} priority />
        </a>
        {/* Plain <a> to /download, same as the hero CTA (middleware redirect, unprefixed only). */}
        <a
          href="/download"
          className={`rounded-full bg-[#89FFB4] px-5 py-2 text-sm font-semibold ${tracking} text-[#18181C] hover:opacity-90 cta-3d`}
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
