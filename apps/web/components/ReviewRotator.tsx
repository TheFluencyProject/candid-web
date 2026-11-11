"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const INTERVAL_MS = 5000;

// One review card in focus at a time. All cards share one grid cell, so the box is as
// tall as the tallest card and the page never jumps between quotes.
// Below it: just three dots — previous, current, next. The current one is a pill whose
// fill grows over INTERVAL_MS; its animationend is what advances the card, so pausing
// the fill (hover) pauses the rotation too and the two can never drift apart.
// It also only runs while the card is on screen, so visitors arriving from the
// hero always start on the first (strongest) review instead of mid-list.
export default function ReviewRotator({ cards }: { cards: ReactNode[] }) {
  const [i, setI] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const n = cards.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const go = (to: number) => setI(((to % n) + n) % n);

  return (
    <div
      ref={ref}
      className="mx-auto max-w-md px-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="grid">
        {cards.map((card, k) => (
          <div
            key={k}
            className={`[grid-area:1/1] transition-all duration-700 ease-out ${
              k === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}
            aria-hidden={k !== i}
          >
            {card}
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          onClick={() => go(i - 1)}
          aria-label="Previous review"
          className="h-1.5 w-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
        />
        <div className="h-1.5 w-8 overflow-hidden rounded-full bg-white/20">
          {/* key={i}: a fresh element per card restarts the fill from empty. */}
          <div
            key={i}
            className="h-full w-full origin-left rounded-full bg-white/60"
            style={{
              animation: `review-progress ${INTERVAL_MS}ms linear forwards`,
              animationPlayState: onScreen && !hovered ? "running" : "paused",
            }}
            onAnimationEnd={() => go(i + 1)}
          />
        </div>
        <button
          onClick={() => go(i + 1)}
          aria-label="Next review"
          className="h-1.5 w-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
        />
      </div>
    </div>
  );
}
