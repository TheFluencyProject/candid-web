"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketingClip } from "@/lib/api";
import MarketingClipCard from "./MarketingClipCard";

// Live version of ScreenshotMarquee: same seamless two-group track + `animate-marquee`
// motion, but each tile is a real clip. Exactly one card plays at a time — it runs to
// the end of its caption segment, then playback hands off to a different card nearest
// the viewport center. Hovering a card pauses the slide and plays that card instead.
//
// `hoveredKey` and the auto-rotation `autoKey` are kept SEPARATE (active = hoveredKey ??
// autoKey). A single shared key would race: short clips fire handoffs every few seconds,
// and that setState could clobber a hover mid-gesture.
export default function MarketingClipMarquee({ clips }: { clips: MarketingClip[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [autoKey, setAutoKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const lastClipIdRef = useRef<string | null>(null);

  const activeKey = hoveredKey ?? autoKey;
  const hovering = hoveredKey !== null;

  // Pick the card instance whose center is nearest the viewport center, skipping the
  // just-played clip so the next one is genuinely different ("a different card near the middle").
  const pick_nearest_center = useCallback((exclude_clip_id: string | null): string | null => {
    const track = trackRef.current;
    if (!track) return null;
    const center_x = window.innerWidth / 2;
    let best: { key: string; dist: number } | null = null;
    for (const el of Array.from(track.querySelectorAll<HTMLElement>("[data-key]"))) {
      if (exclude_clip_id && el.getAttribute("data-clip-id") === exclude_clip_id) continue;
      const rect = el.getBoundingClientRect();
      if (rect.right < 0 || rect.left > window.innerWidth) continue; // off-screen
      const dist = Math.abs(rect.left + rect.width / 2 - center_x);
      if (!best || dist < best.dist) best = { key: el.getAttribute("data-key")!, dist };
    }
    return best?.key ?? null;
  }, []);

  // Pick an initial card, and re-pick whenever auto-rotation has no card (handoff found none).
  useEffect(() => {
    if (autoKey || clips.length === 0) return;
    const id = requestAnimationFrame(() => {
      const key = pick_nearest_center(null);
      if (key) setAutoKey(key);
    });
    return () => cancelAnimationFrame(id);
  }, [autoKey, clips.length, pick_nearest_center]);

  // Remember the active clip id so the next handoff avoids repeating it.
  const active_clip_id = activeKey ? activeKey.split("::")[1] : null;
  useEffect(() => {
    if (active_clip_id) lastClipIdRef.current = active_clip_id;
  }, [active_clip_id]);

  // Only the non-looping (auto) card reaches here; advance the auto pointer.
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
            loop={hoveredKey === key}
            onHoverStart={() => setHoveredKey(key)}
            onSegmentEnd={handle_segment_end}
          />
        );
      })}
    </div>
  );

  return (
    <div className="overflow-hidden w-full py-4 md:py-8">
      {/* Pause the slide while the pointer is anywhere over the row so the hovered
          clip + its karaoke caption are readable. Leave is handled at the track level so
          moving between adjacent cards doesn't flicker the hover state. */}
      <div
        ref={trackRef}
        className="flex w-max animate-marquee"
        style={{ animationPlayState: hovering ? "paused" : "running" }}
        onMouseLeave={() => setHoveredKey(null)}
      >
        {render_group(0, false)}
        {render_group(1, true)}
      </div>
    </div>
  );
}
