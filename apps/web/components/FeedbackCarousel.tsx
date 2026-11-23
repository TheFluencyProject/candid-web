"use client";

import Image from "next/image";
import { useRef } from "react";

type Slide = { src: string; width: number; height: number; alt: string };

const CARD_HEIGHT = 288;
const EDGE = "max(24px, calc((100vw - 720px) / 2 + 24px))";

// A row of screenshots you swipe through, like an App Store screenshot row. Cards are at most 72% of
// the screen on phones, so a good chunk of the next one always peeks in from the right. The row
// breaks out of the text column to span the whole screen, with its first card lined up with the text.
// Touch and trackpad use native scroll + snap; a mouse can drag the row, and clicking a card that's
// partly off-screen scrolls it into view.
export default function FeedbackCarousel({ slides }: { slides: Slide[] }) {
  // The track is `relative`, so each card's offsetLeft is measured from the track's edge.
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const snap_to = (card: HTMLElement) => {
    const track = trackRef.current;
    if (!track) return;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    track.scrollTo({ left: card.offsetLeft - pad, behavior: "smooth" });
  };

  const nearest_card = () => {
    const track = trackRef.current;
    if (!track) return null;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const cards = Array.from(track.children) as HTMLElement[];
    return cards.reduce((best, c) =>
      Math.abs(c.offsetLeft - pad - track.scrollLeft) < Math.abs(best.offsetLeft - pad - track.scrollLeft) ? c : best,
    );
  };

  const on_pointer_down = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !trackRef.current) return;
    drag.current = { x: e.clientX, left: trackRef.current.scrollLeft, moved: false };
  };

  const on_pointer_move = (e: React.PointerEvent) => {
    const track = trackRef.current;
    const d = drag.current;
    if (!d || !track) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 5) return;
    if (!d.moved) {
      d.moved = true;
      track.style.scrollSnapType = "none";
      track.setPointerCapture(e.pointerId);
    }
    track.scrollLeft = d.left - dx;
  };

  const end_drag = () => {
    const track = trackRef.current;
    const d = drag.current;
    drag.current = null;
    if (!d?.moved || !track) return;
    const card = nearest_card();
    if (card) snap_to(card);
    // Turn snap back on once the smooth scroll has settled.
    setTimeout(() => { track.style.scrollSnapType = ""; }, 400);
    // Swallow the click that follows a drag.
    track.addEventListener("click", (ev) => ev.stopPropagation(), { capture: true, once: true });
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={on_pointer_down}
      onPointerMove={on_pointer_move}
      onPointerUp={end_drag}
      onPointerCancel={end_drag}
      className="relative my-2 flex w-screen items-start gap-3 overflow-x-auto snap-x snap-mandatory pb-1 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      // Full-bleed: centered on the screen; padding = where the 720px column's text starts.
      style={{ marginLeft: "calc(50% - 50vw)", paddingInline: EDGE, scrollPaddingInline: EDGE }}
    >
      {slides.map((s) => (
        <div
          key={s.src}
          onClick={(e) => snap_to(e.currentTarget)}
          className="shrink-0 snap-start overflow-hidden rounded-xl bg-black/30 ring-1 ring-inset ring-white/15"
          style={{ aspectRatio: `${s.width} / ${s.height}`, width: `min(72vw, ${Math.round((s.width / s.height) * CARD_HEIGHT)}px)` }}
        >
          <Image
            src={s.src}
            alt={s.alt}
            width={s.width}
            height={s.height}
            draggable={false}
            sizes="(min-width: 768px) 700px, 72vw"
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
