"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A row that drifts left on its own and can also be dragged or scrolled sideways (Adam 11/17). The content is
// rendered twice (`children` = both copies), so the offset wraps at half the track width with no seam. After a
// drag it coasts a little, then goes back to drifting. Vertical page scrolling is never captured.
export default function DriftRow({ children, seconds }: { children: ReactNode; seconds: number }) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let x = 0, v = 0, last = performance.now(), raf = 0;
    let drag: { id: number; x0: number; px: number; t: number } | null = null;
    const half = () => track.scrollWidth / 2;
    const wrap = () => {
      const h = half();
      if (h > 0) x = ((x % h) + h) % h;
    };
    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      if (!drag) {
        const drift = half() / seconds; // px/s
        x += (drift + v) * dt;
        v *= Math.pow(0.04, dt); // coast down to the drift speed
        if (Math.abs(v) < 1) v = 0;
      }
      wrap();
      track.style.transform = `translate3d(${-x}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x0: e.clientX, px: e.clientX, t: performance.now() };
      v = 0;
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.px, now = performance.now();
      if (Math.abs(e.clientX - drag.x0) > 4 && !track.hasPointerCapture(e.pointerId)) track.setPointerCapture(e.pointerId);
      x -= dx;
      v = (-dx / Math.max(1, now - drag.t)) * 1000;
      drag.px = e.clientX;
      drag.t = now;
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (performance.now() - drag.t > 80) v = 0; // held still before letting go: no coast
      drag = null;
    };
    // Sideways trackpad / shift-wheel scrolls the row; mostly-vertical wheel stays with the page.
    const wheel = (e: WheelEvent) => {
      const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      x += dx;
      v = 0;
    };
    track.addEventListener("pointerdown", down);
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
    track.addEventListener("wheel", wheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("pointerdown", down);
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
      track.removeEventListener("pointercancel", up);
      track.removeEventListener("wheel", wheel);
    };
  }, [seconds]);

  return (
    <div ref={trackRef} className="flex w-max cursor-grab select-none touch-pan-y active:cursor-grabbing">
      {children}
    </div>
  );
}
