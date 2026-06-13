"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketingClip } from "@/lib/api";
import MarketingClipCard from "./MarketingClipCard";

// Continuous drift speed; roughly matches the old CSS marquee's slow pace.
const SCROLL_SPEED_PX_PER_SEC = 38;

// A horizontally drifting, drag-scrollable row of live clips. The drift NEVER stops on
// its own — dragging pauses it (and repositions), releasing resumes. Exactly one card
// plays at a time, handing off to a different near-center card when its segment ends.
// Two identical groups make the loop seamless; only near-viewport cards load video.
export default function MarketingClipMarquee({ clips }: { clips: MarketingClip[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const dragRef = useRef({ startX: 0, startScroll: 0 });
  const lastClipIdRef = useRef<string | null>(null);

  const [autoKey, setAutoKey] = useState<string | null>(null);
  const [inView, setInView] = useState<Set<string>>(() => new Set());

  // Playback follows the auto-rotation only — hovering the row never pauses or hijacks it.
  const activeKey = autoKey;

  // ── Continuous auto-scroll. Paused only while dragging (draggingRef). ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || clips.length === 0) return;
    let raf = 0;
    let last = 0;
    const step = (ts: number) => {
      if (last && !draggingRef.current) {
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

  // ── Drag to scroll (Pointer Events cover mouse + touch). Release resumes the drift. ──
  const on_pointer_down = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    draggingRef.current = true;
    dragRef.current = { startX: e.clientX, startScroll: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  };
  const on_pointer_move = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    let next = dragRef.current.startScroll - (e.clientX - dragRef.current.startX);
    if (half > 0) next = ((next % half) + half) % half; // wrap both directions
    el.scrollLeft = next;
  };
  const end_drag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    scrollRef.current?.releasePointerCapture(e.pointerId);
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

  useEffect(() => {
    if (autoKey || clips.length === 0) return;
    const id = requestAnimationFrame(() => {
      const k = pick_nearest_center(null);
      if (k) setAutoKey(k);
    });
    return () => cancelAnimationFrame(id);
  }, [autoKey, clips.length, pick_nearest_center]);

  const active_clip_id = activeKey ? activeKey.split("::")[1] : null;
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
            isActive={activeKey === key}
            shouldLoad={inView.has(key)}
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
      onPointerUp={end_drag}
      onPointerCancel={end_drag}
      className="w-full overflow-x-auto cursor-grab active:cursor-grabbing select-none py-4 md:py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-y]"
    >
      <div className="flex w-max">
        {render_group(0, false)}
        {render_group(1, true)}
      </div>
    </div>
  );
}
