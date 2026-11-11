"use client";

import { useEffect, useState, type ReactNode } from "react";

const INTERVAL_MS = 5000;

// One review card in focus at a time; every INTERVAL_MS it crossfades to the next.
// All cards share one grid cell, so the box is as tall as the tallest card and the
// page never jumps between quotes. Hover pauses; the dots jump straight to a card.
export default function ReviewRotator({ cards }: { cards: ReactNode[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    // Keyed on i so a dot tap restarts the full interval instead of cutting it short.
    const id = setTimeout(() => setI((n) => (n + 1) % cards.length), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [i, paused, cards.length]);

  return (
    <div
      className="mx-auto max-w-md px-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid">
        {cards.map((card, n) => (
          <div
            key={n}
            className={`[grid-area:1/1] transition-all duration-700 ease-out ${
              n === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}
            aria-hidden={n !== i}
          >
            {card}
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-center gap-2">
        {cards.map((_, n) => (
          <button
            key={n}
            onClick={() => setI(n)}
            aria-label={`Review ${n + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              n === i ? "w-5 bg-white/60" : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
