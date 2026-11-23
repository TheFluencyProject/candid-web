"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Slide = { src: string; width: number; height: number; alt: string };

// One screenshot per view. Native horizontal scroll + CSS scroll-snap, so touch swipe needs no
// library; dots show and jump to the current card, arrows (lg+ only, where the page padding fits them) step one card.
export default function FeedbackCarousel({ slides }: { slides: Slide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go_to = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  };

  const on_scroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const arrow = "hidden lg:flex absolute top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white text-xl hover:bg-white/20 transition-colors disabled:opacity-0";

  return (
    <div className="my-6">
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={on_scroll}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s) => (
            <div key={s.src} className="w-full shrink-0 snap-center flex items-center justify-center bg-black/30">
              <Image src={s.src} alt={s.alt} width={s.width} height={s.height} sizes="(min-width: 768px) 672px, 100vw" className="w-full h-auto" />
            </div>
          ))}
        </div>
        <button type="button" aria-label="Previous" onClick={() => go_to(index - 1)} disabled={index === 0} className={`${arrow} -left-14`}>
          ‹
        </button>
        <button type="button" aria-label="Next" onClick={() => go_to(index + 1)} disabled={index === slides.length - 1} className={`${arrow} -right-14`}>
          ›
        </button>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            aria-label={`Show feedback ${i + 1}`}
            aria-current={i === index}
            onClick={() => go_to(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
