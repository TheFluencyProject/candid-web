"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// Fixed top bar (wordmark + Try for free), visible from the first frame (Adam 11/17: it used to slide in only
// once the hero's own CTA had scrolled off), so a download button is always one tap away.
// Its button takes the color of whichever of the page's Try buttons ([data-primary-cta]) is on screen, the one
// nearest the middle if two are; mint when none is (Adam 11/17). The sticker-circle button cycles colors
// (.cta-cycle): the bar's button runs the same animation, locked to its clock, so they match every frame.
export default function ScrollNav({ ctaLabel, tracking }: { ctaLabel: string; tracking: string }) {
  const pillRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const visible = new Set<HTMLElement>();
    const cycle = (el: Element) => el.getAnimations().find((a) => (a as CSSAnimation).animationName === "cta-cycle");
    const apply = () => {
      const mid = innerHeight / 2;
      let best: HTMLElement | null = null;
      let best_d = Infinity;
      for (const el of visible) {
        const r = el.getBoundingClientRect();
        const d = Math.abs((r.top + r.bottom) / 2 - mid);
        if (d < best_d) { best_d = d; best = el; }
      }
      const cycling = !!best?.classList.contains("cta-cycle");
      if (cycling) {
        pill.style.removeProperty("--cta");
        pill.classList.add("cta-cycle");
        const mine = cycle(pill), theirs = best && cycle(best);
        if (mine && theirs && mine.startTime !== theirs.startTime) mine.startTime = theirs.startTime;
      } else {
        pill.classList.remove("cta-cycle");
        if (best) pill.style.setProperty("--cta", getComputedStyle(best).getPropertyValue("--cta").trim());
        else pill.style.removeProperty("--cta");
      }
    };
    // "On screen" = below this bar (61px) and above the bottom edge.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target as HTMLElement);
          else visible.delete(e.target as HTMLElement);
        }
        apply();
      },
      { rootMargin: "-61px 0px 0px 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-primary-cta]").forEach((el) => io.observe(el));
    // Two on screen: which is nearer the middle changes as you scroll. The path's button changes color in place.
    let queued = false;
    const onScroll = () => {
      if (visible.size < 2 || queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; apply(); });
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("cta-tint", apply);
    return () => {
      io.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("cta-tint", apply);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.06] bg-[#18181C]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        <a href="/" className="hover:opacity-80 transition-opacity">
          <Image src="/wordmark-white.svg" alt="Candid" width={80} height={21} priority />
        </a>
        {/* Plain <a> to /download, same as the hero CTA (middleware redirect, unprefixed only). */}
        <a
          ref={pillRef}
          href="/download"
          className={`rounded-full bg-[#89FFB4] px-5 py-2 text-sm font-semibold ${tracking} text-[#18181C] hover:opacity-90 cta-3d`}
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
