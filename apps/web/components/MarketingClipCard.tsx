"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MarketingClip } from "@/lib/api";

// iOS AccentColor (display-p3 0x89/0xFF/0xB4) — the karaoke word sweep, by role not appearance.
const KARAOKE_ACCENT = "#89FFB4";

// Deterministic pseudo-random in [0,1) from a string — stable across SSR/client so the
// decorative story-bar fills don't cause a hydration mismatch.
function seeded_unit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

type Props = {
  clip: MarketingClip;
  dataKey: string;
  isActive: boolean;
  /** While true (this card is hovered), replay the segment instead of handing off. */
  loop: boolean;
  onHoverStart: () => void;
  onSegmentEnd: () => void;
};

export default function MarketingClipCard({ clip, dataKey, isActive, loop, onHoverStart, onSegmentEnd }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [ready, setReady] = useState(false); // first frame buffered → fade video over poster

  // Read loop/onSegmentEnd through refs so the play effect depends only on `isActive`.
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const onSegmentEndRef = useRef(onSegmentEnd);
  onSegmentEndRef.current = onSegmentEnd;

  // Prebuffer on mount (paused at the segment start) so hover / handoff plays instantly —
  // the hls instance lives for the card's lifetime, never torn down on deactivate.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = `https://stream.mux.com/${clip.mux_playback_id}.m3u8`;
    let hls: import("hls.js").default | null = null;
    let cancelled = false;
    const on_ready = () => {
      if (cancelled) return;
      try { video.currentTime = clip.start_time; } catch { /* not seekable yet */ }
      setReady(true);
    };

    // Prefer hls.js (MSE) — Chromium reports canPlayType('…mpegurl') truthy but can't
    // actually play an m3u8 natively, so native HLS is the Safari/iOS-only fallback.
    import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (Hls.isSupported()) {
        // Bound the buffer to this short segment so N prebuffered cards stay cheap.
        hls = new Hls({
          startPosition: clip.start_time,
          maxBufferLength: Math.ceil(clip.end_time - clip.start_time) + 4,
        });
        hls.on(Hls.Events.MANIFEST_PARSED, on_ready);
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", on_ready, { once: true });
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
      video.removeAttribute("src");
    };
  }, [clip]);

  // Play only while active; pause + rewind otherwise. Karaoke + end-of-segment via rAF
  // (smoother than `timeupdate`). The video is already buffered, so play() is instant.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      video.pause();
      try { video.currentTime = clip.start_time; } catch { /* ignore */ }
      return;
    }

    let raf = 0;
    let cancelled = false;
    try { video.currentTime = clip.start_time; } catch { /* ignore */ }
    video.play().catch(() => {});

    const tick = () => {
      if (cancelled) return;
      const t = video.currentTime;
      const wlc = clip.word_level_captions;
      if (wlc) setActiveWordIdx(wlc.findIndex((w) => t >= w.start_time && t < w.end_time));

      if (t >= clip.end_time) {
        if (loopRef.current) {
          try { video.currentTime = clip.start_time; } catch { /* ignore */ }
        } else {
          cancelled = true;
          onSegmentEndRef.current();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      setActiveWordIdx(-1);
      video.pause();
    };
  }, [isActive, clip]);

  const words = clip.word_level_captions;

  // Decorative 3-bar story header — a random "mid-story" fill per card.
  const seed = seeded_unit(clip.caption_segment_id);
  const active_bar = Math.floor(seed * 3);
  const partial_fill = 0.2 + seeded_unit(clip.caption_segment_id + "p") * 0.7;

  // Unique id (strip the colons useId emits, which break url(#…)) for the toggle knockout.
  const toggle_mask_id = useId().replace(/:/g, "");

  return (
    <div
      data-key={dataKey}
      data-clip-id={clip.caption_segment_id}
      onMouseEnter={onHoverStart}
      className="relative h-[340px] md:h-[500px] aspect-[9/16] shrink-0 overflow-hidden rounded-[1.25rem] shadow-2xl select-none bg-black"
    >
      {/* Poster stays mounted: instant paint + stable marquee width before the video buffers. */}
      {clip.thumbnail_url && (
        <img
          src={clip.thumbnail_url}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
      />

      {/* Top chrome — title + decorative 3-bar story header (matches the static mockups). */}
      <div className="absolute inset-x-0 top-0 px-4 pt-3 pb-6 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-white text-xs md:text-sm font-semibold drop-shadow">{clip.title}</span>
          {/* SF Symbols switch.2 (the iOS immersion toggle, LessonHeaderView) — top: outlined
              capsule, knob left; bottom: filled capsule with a knocked-out knob on the right. */}
          <svg width="23" height="17" viewBox="0 0 25 18" fill="none" className="shrink-0 text-white" aria-hidden>
            <rect x="0.9" y="1" width="20.2" height="7" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2.6" y="2.7" width="7.2" height="3.6" rx="1.8" fill="currentColor" />
            <mask id={toggle_mask_id}>
              <rect x="3.9" y="10" width="20.2" height="7" rx="3.5" fill="white" />
              <rect x="15.3" y="11.7" width="7.2" height="3.6" rx="1.8" fill="black" />
            </mask>
            <rect x="3.9" y="10" width="20.2" height="7" rx="3.5" fill="currentColor" mask={`url(#${toggle_mask_id})`} />
          </svg>
        </div>
        <div className="mt-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[4px] flex-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: `${(i < active_bar ? 1 : i === active_bar ? partial_fill : 0) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — caption (word-level karaoke) + translation. Anchored from a fixed
          vertical point so every card's caption starts at the same Y and flows downward,
          regardless of how many lines it wraps to. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
      <div className="absolute inset-x-0 top-[56%] px-4">
        <p className="text-white text-[1.35rem] md:text-[1.6875rem] font-bold leading-tight drop-shadow">
          {words && words.length > 0
            ? words.map((w, i) => (
                <span key={i} style={i === activeWordIdx ? { color: KARAOKE_ACCENT } : undefined}>
                  {w.text}{i < words.length - 1 ? " " : ""}
                </span>
              ))
            : clip.text}
        </p>
        {clip.translation && clip.translation !== clip.text && (
          <p className="mt-1.5 text-white/90 text-[0.9rem] md:text-[1.0125rem] font-medium leading-snug drop-shadow">{clip.translation}</p>
        )}
      </div>
    </div>
  );
}
