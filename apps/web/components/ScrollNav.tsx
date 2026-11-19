"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// Fixed top bar (wordmark + Try for free), visible from the first frame (Adam 11/17: it used to slide in only
// once the hero's own CTA had scrolled off), so a download button is always one tap away. Phones hide its button until the
// hero's has scrolled under the bar (Adam 11/18, below).
// Its button takes the color of the Try button ([data-primary-cta]) of the section at the top of the page: it only
// switches once the next section has scrolled up to the bar, not when that section's button first peeks in at the
// bottom (Adam 11/19; was "whichever button is on screen", 11/17). The sticker-circle button cycles colors
// (.cta-cycle): the bar's button runs the same animation, locked to its clock, so they match every frame.
// No ctaLabel = wordmark only (the lesson page's path arm, whose own buttons are always on screen); the pill's effects
// below all return early without it.
// How far below the bar a section's top may still be when the bar takes its color: "basically at the top".
const TOP_SLACK = 0.15;

export default function ScrollNav({ ctaLabel, tracking = "" }: { ctaLabel?: string; tracking?: string }) {
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
    const ctas = [...document.querySelectorAll<HTMLElement>("[data-primary-cta]")];
    const cycle = (el: Element) => el.getAnimations().find((a) => (a as CSSAnimation).animationName === "cta-cycle");
    let shown: HTMLElement | null | undefined;
    const apply = (force = false) => {
      // The last section (document order) whose top is at the bar, give or take TOP_SLACK of the screen.
      const line = 61 + innerHeight * TOP_SLACK;
      let best: HTMLElement | null = null;
      for (const el of ctas) if ((el.closest("section") ?? el).getBoundingClientRect().top <= line) best = el;
      if (best === shown && !force) return;
      shown = best;
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
    const onScroll = () => apply();
    const onTint = () => apply(true); // the path's button changes color in place
    apply();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    addEventListener("cta-tint", onTint);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      removeEventListener("cta-tint", onTint);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-30">
      <div ref={bgRef} aria-hidden className="absolute inset-0 border-b border-white/[0.06] bg-[#18181C]/80 opacity-0 backdrop-blur-xl" />
      {/* 61px tall, always: the pinned headings sit at top: 61px (the divider no longer adds its 1px since it moved
          to the fading layer; a 60px bar left a 1px slit the page showed through, Adam 11/18). */}
      <div className="relative flex min-h-[61px] items-center justify-between px-4 md:px-8 py-3">
        <a href="/" className="hover:opacity-80 transition-opacity">
          <Image src="/wordmark-white.svg" alt="Candid" width={80} height={21} priority />
        </a>
        {/* Plain <a> to /download, same as the hero CTA (middleware redirect, unprefixed only). */}
        {ctaLabel && (
          <span ref={wrapRef} className="nav-pill flex">
            <a
              ref={pillRef}
              href="/download"
              className={`rounded-full bg-[#89FFB4] px-5 py-2 text-sm font-semibold ${tracking} text-[#18181C] hover:opacity-90 cta-3d`}
            >
              {ctaLabel}
            </a>
          </span>
        )}
      </div>
    </div>
  );
}
