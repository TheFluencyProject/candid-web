"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// Fixed top bar (wordmark + Try for free), visible from the first frame (Adam 11/17: it used to slide in only
// once the hero's own CTA had scrolled off), so a download button is always one tap away. Phones hide its button until the
// hero's has scrolled under the bar (Adam 11/18, below).
// Its button takes the color of whichever of the page's Try buttons ([data-primary-cta]) is on screen, the upper
// one if two are, so it only switches once that one has gone under the bar; mint when none is (Adam 11/17). The sticker-circle button cycles colors
// (.cta-cycle): the bar's button runs the same animation, locked to its clock, so they match every frame.
export default function ScrollNav({ ctaLabel, tracking }: { ctaLabel: string; tracking: string }) {
  const pillRef = useRef<HTMLAnchorElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);

  // At the very top the bar has no background or divider; both fade in over the first FADE_PX of scroll
  // (Adam 11/17).
  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;
    const FADE_PX = 40;
    const set = () => { bg.style.opacity = String(Math.min(1, Math.max(0, scrollY / FADE_PX))); };
    set();
    addEventListener("scroll", set, { passive: true });
    return () => removeEventListener("scroll", set);
  }, []);

  // Phones (Adam 11/18): the button stays hidden (CSS, .nav-pill) while the hero's own button is on screen or
  // below it, and fades in once that one has scrolled under this bar. Desktop always shows it.
  useEffect(() => {
    const wrap = wrapRef.current;
    const hero = document.getElementById("hero-cta");
    if (!wrap) return;
    if (!hero) { wrap.classList.add("nav-pill-on"); return; }
    const io = new IntersectionObserver(
      ([e]) => wrap.classList.toggle("nav-pill-on", !e.isIntersecting && e.boundingClientRect.top < 61),
      { rootMargin: "-61px 0px 0px 0px" },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const visible = new Set<HTMLElement>();
    const cycle = (el: Element) => el.getAnimations().find((a) => (a as CSSAnimation).animationName === "cta-cycle");
    const apply = () => {
      let best: HTMLElement | null = null;
      let best_top = Infinity;
      for (const el of visible) {
        const top = el.getBoundingClientRect().top;
        if (top < best_top) { best_top = top; best = el; }
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
    // The path's button changes color in place.
    addEventListener("cta-tint", apply);
    return () => {
      io.disconnect();
      removeEventListener("cta-tint", apply);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-30">
      <div ref={bgRef} aria-hidden className="absolute inset-0 border-b border-white/[0.06] bg-[#18181C]/80 opacity-0 backdrop-blur-xl" />
      <div className="relative flex items-center justify-between px-4 md:px-8 py-3">
        <a href="/" className="hover:opacity-80 transition-opacity">
          <Image src="/wordmark-white.svg" alt="Candid" width={80} height={21} priority />
        </a>
        {/* Plain <a> to /download, same as the hero CTA (middleware redirect, unprefixed only). */}
        <span ref={wrapRef} className="nav-pill flex">
          <a
            ref={pillRef}
            href="/download"
            className={`rounded-full bg-[#89FFB4] px-5 py-2 text-sm font-semibold ${tracking} text-[#18181C] hover:opacity-90 cta-3d`}
          >
            {ctaLabel}
          </a>
        </span>
      </div>
    </div>
  );
}
