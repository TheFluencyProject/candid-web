"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketingClip } from "@/lib/api";
import MarketingClipCard from "./MarketingClipCard";

// Continuous drift speed; roughly matches the old CSS marquee's slow pace.
const SCROLL_SPEED_PX_PER_SEC = 38;
// How long after the last user-scroll event before we resume the drift + recompute.
const SETTLE_MS = 160;

// A horizontally drifting row of live clips. The drift runs continuously and only pauses
// while the user is interacting; when the interaction settles it resumes AND recomputes
// which near-center card plays. Touch/trackpad use the browser's NATIVE scroll (reliable
// on iOS — JS pointer-drag gets cancelled there); a mouse uses JS drag (the browser won't
// drag-scroll for a mouse). Two identical groups make the loop seamless; only near-viewport
// cards load video.
export default function MarketingClipMarquee({ clips }: { clips: MarketingClip[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false); // drift paused while the user interacts
  const mouseDragRef = useRef(false); // mouse-only JS drag in progress
  const dragRef = useRef({ startX: 0, startScroll: 0 });
  const settleTimerRef = useRef<number | null>(null);
  const lastClipIdRef = useRef<string | null>(null);

  const [autoKey, setAutoKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [inView, setInView] = useState<Set<string>>(() => new Set());

  // Hovering a card makes it THE playing card (sets autoKey) and loops it while the cursor
  // stays on it. Mouse-leave clears only hoveredKey — autoKey stays, so the card keeps
  // playing to its end then hands off to the near-center card (no fallback to a stale,
  // possibly off-screen card). Hover never pauses the drift — only dragging/scrolling does.

  // Nearest-to-viewport-center visible card, optionally excluding a just-played clip id.
  const pick_nearest_center = useCallback((exclude_clip_id: string | null): string | null => {
    const root = scrollRef.current;
    if (!root) return null;
    const center_x = window.innerWidth / 2;
    let best: { key: string; dist: number } | null = null;
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-key]"))) {
      if (exclude_clip_id && el.getAttribute("data-clip-id") === exclude_clip_id) continue;
      const rect = el.getBoundingClientRect();
      if (rect.right < 0 || rect.left > window.innerWidth) continue;
      const dist = Math.abs(rect.left + rect.width / 2 - center_x);
      if (!best || dist < best.dist) best = { key: el.getAttribute("data-key")!, dist };
    }
    return best?.key ?? null;
  }, []);

  // End of an interaction: normalize the wrap, resume drift, recompute the playing card.
  const settle = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    const el = scrollRef.current;
    if (el) {
      const half = el.scrollWidth / 2; // groups are identical, so a half-wrap is invisible
      if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
    }
    pausedRef.current = false;
    setHoveredKey(null); // a scroll means they're no longer hovering — let center card play
    setAutoKey(pick_nearest_center(null));
  }, [pick_nearest_center]);

  const schedule_settle = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(settle, SETTLE_MS);
  }, [settle]);

  // ── Continuous auto-drift. Paused while the user interacts (pausedRef). ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || clips.length === 0) return;
    let raf = 0;
    let last = 0;
    const step = (ts: number) => {
      if (last && !pausedRef.current) {
        const half = el.scrollWidth / 2; // one group; group 2 is an identical copy
        if (half > 0) {
          let next = el.scrollLeft + (SCROLL_SPEED_PX_PER_SEC * (ts - last)) / 1000;
          if (next >= half) next -= half; // seamless wrap
          el.scrollLeft = next;
        }
      }
      last = ts;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [clips.length]);

  // ── Mouse drag (the browser won't drag-scroll for a mouse; touch uses native scroll). ──
  const on_pointer_down = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    pausedRef.current = true; // any interaction pauses the drift
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    if (e.pointerType === "mouse") {
      mouseDragRef.current = true;
      dragRef.current = { startX: e.clientX, startScroll: el.scrollLeft };
      el.setPointerCapture(e.pointerId);
    }
  };
  const on_pointer_move = (e: React.PointerEvent) => {
    if (!mouseDragRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    let next = dragRef.current.startScroll - (e.clientX - dragRef.current.startX);
    if (half > 0) next = ((next % half) + half) % half; // wrap both directions
    el.scrollLeft = next;
  };
  const on_pointer_up = (e: React.PointerEvent) => {
    if (mouseDragRef.current) {
      mouseDragRef.current = false;
      scrollRef.current?.releasePointerCapture(e.pointerId);
      settle(); // mouse release settles immediately
    } else {
      schedule_settle(); // touch tap/drag end — also covers a tap that never scrolled
    }
  };

  // ── Native scroll (touch momentum, trackpad): keep paused, settle when it stops. The
  //    drift's own scrollLeft writes fire scroll too, but only while NOT paused — so they
  //    fall through the guard and don't re-pause. ──
  const on_scroll = () => {
    if (mouseDragRef.current) return; // mouse drag settles on pointer-up
    if (!pausedRef.current) return; // this scroll came from our own drift
    schedule_settle();
  };
  // Trackpad/wheel doesn't fire pointerdown — pause on a horizontal wheel so the drift
  // doesn't fight it (vertical wheel = page scroll, leave the drift running).
  const on_wheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    pausedRef.current = true;
    schedule_settle();
  };

  // ── Load video only for cards near the viewport (bounds simultaneous <video>s). ──
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        setInView((prev) => {
          const next = new Set(prev);
          for (const e of entries) {
            const k = (e.target as HTMLElement).getAttribute("data-key");
            if (!k) continue;
            if (e.isIntersecting) next.add(k);
            else next.delete(k);
          }
          return next;
        });
      },
      { root, rootMargin: "0px 300px", threshold: 0.01 },
    );
    root.querySelectorAll("[data-key]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [clips]);

  // ── Playback: pick the near-center card; hand off to a different one on segment end. ──
  useEffect(() => {
    if (autoKey || clips.length === 0) return;
    const id = requestAnimationFrame(() => {
      const k = pick_nearest_center(null);
      if (k) setAutoKey(k);
    });
    return () => cancelAnimationFrame(id);
  }, [autoKey, clips.length, pick_nearest_center]);

  const active_clip_id = autoKey ? autoKey.split("::")[1] : null;
  useEffect(() => {
    if (active_clip_id) lastClipIdRef.current = active_clip_id;
  }, [active_clip_id]);

  const handle_segment_end = useCallback(() => {
    setAutoKey(pick_nearest_center(lastClipIdRef.current));
  }, [pick_nearest_center]);

  if (clips.length === 0) return null;

  const render_group = (group_idx: number, duplicate: boolean) => (
    <div className="flex shrink-0 gap-4 md:gap-6 pr-4 md:pr-6" aria-hidden={duplicate || undefined}>
      {clips.map((clip) => {
        const key = `${group_idx}::${clip.caption_segment_id}`;
        return (
          <MarketingClipCard
            key={key}
            dataKey={key}
            clip={clip}
            isActive={autoKey === key}
            loop={hoveredKey === key}
            shouldLoad={inView.has(key)}
            onHoverStart={() => { setHoveredKey(key); setAutoKey(key); }}
            onSegmentEnd={handle_segment_end}
          />
        );
      })}
    </div>
  );

  return (
    <div
      ref={scrollRef}
      onPointerDown={on_pointer_down}
      onPointerMove={on_pointer_move}
      onPointerUp={on_pointer_up}
      onPointerCancel={on_pointer_up}
      onScroll={on_scroll}
      onWheel={on_wheel}
      onMouseLeave={() => setHoveredKey(null)}
      className="w-full overflow-x-auto select-none py-4 md:py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x_pan-y]"
    >
      <div className="flex w-max">
        {render_group(0, false)}
        {render_group(1, true)}
      </div>
    </div>
  );
}
