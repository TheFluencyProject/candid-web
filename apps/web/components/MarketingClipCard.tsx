"use client";

import { useEffect, useRef, useState } from "react";
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

// Pull emoji out of a title so the text line stays clean (and survives truncation).
function split_title(title: string): { emoji: string; text: string } {
  const re = /\p{Extended_Pictographic}️?/gu;
  const emoji = (title.match(re) || []).join("");
  const text = title.replace(re, "").replace(/\s+/g, " ").trim();
  return { emoji, text };
}

type Props = {
  clip: MarketingClip;
  dataKey: string;
  isActive: boolean;
  /** Load the video only when the card is near the viewport — bounds simultaneous
   *  <video> elements so mobile (hard media-element limit) doesn't drop later cards. */
  shouldLoad: boolean;
  onSegmentEnd: () => void;
};

export default function MarketingClipCard({ clip, dataKey, isActive, shouldLoad, onSegmentEnd }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [ready, setReady] = useState(false); // first frame buffered → fade video over poster

  const onSegmentEndRef = useRef(onSegmentEnd);
  onSegmentEndRef.current = onSegmentEnd;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const play_from_start = (video: HTMLVideoElement) => {
    try { video.currentTime = clip.start_time; } catch { /* not seekable yet */ }
    video.play().then(() => setReady(true)).catch(() => {});
  };

  // Load (prebuffer) the video only while near the viewport; attach once, tear down when
  // it scrolls away. Keeps the live <video> count low enough for mobile media limits.
  useEffect(() => {
    if (!shouldLoad) return;
    const video = videoRef.current;
    if (!video) return;

    const src = `https://stream.mux.com/${clip.mux_playback_id}.m3u8`;
    let hls: import("hls.js").default | null = null;
    let cancelled = false;
    const on_ready = () => {
      if (cancelled) return;
      try { video.currentTime = clip.start_time; } catch { /* ignore */ }
      setReady(true);
      if (isActiveRef.current) play_from_start(video); // already active when it finished loading
    };

    // Prefer hls.js (MSE); native HLS is the Safari/iOS-only fallback.
    import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (Hls.isSupported()) {
        hls = new Hls({ startPosition: clip.start_time, maxBufferLength: Math.ceil(clip.end_time - clip.start_time) + 4 });
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
      setReady(false);
    };
  }, [shouldLoad, clip]);

  // Play only while active; pause + rewind otherwise. Karaoke + end-of-segment via rAF.
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
    play_from_start(video); // no-op until loaded; on_ready re-fires play once buffered

    const tick = () => {
      if (cancelled) return;
      const t = video.currentTime;
      const wlc = clip.word_level_captions;
      if (wlc) {
        // Keep each word highlighted until the NEXT word starts (or the clip ends) —
        // no blank gap between words. wlc is sorted by start_time.
        let idx = -1;
        for (let k = 0; k < wlc.length && t >= wlc[k].start_time; k++) idx = k;
        setActiveWordIdx(idx);
      }

      if (t >= clip.end_time) {
        cancelled = true;
        onSegmentEndRef.current();
        return;
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
  const { emoji, text: title_text } = split_title(clip.title);

  // Decorative 3-bar story header — a random "mid-story" fill per card.
  const seed = seeded_unit(clip.caption_segment_id);
  const active_bar = Math.floor(seed * 3);
  const partial_fill = 0.2 + seeded_unit(clip.caption_segment_id + "p") * 0.7;

  return (
    <div
      data-key={dataKey}
      data-clip-id={clip.caption_segment_id}
      // isolate: own stacking context so the overlay layers always paint above the
      // <video> (mobile promotes playing video to its own layer otherwise).
      className="relative isolate h-[340px] md:h-[500px] aspect-[9/16] shrink-0 overflow-hidden rounded-[1.25rem] shadow-[0_4px_20px_rgba(0,0,0,0.22)] select-none bg-black"
    >
      {/* Poster stays mounted: instant paint + stable width before the video buffers. */}
      {clip.thumbnail_url && (
        <img src={clip.thumbnail_url} alt="" draggable={false} className="absolute inset-0 z-0 h-full w-full object-cover" />
      )}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
      />

      {/* Top chrome — emoji + title + decorative 3-bar story header. */}
      <div className="absolute inset-x-0 top-0 z-10 px-4 pt-3 pb-6 bg-gradient-to-b from-black/45 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {emoji && <span className="shrink-0 text-sm md:text-base drop-shadow">{emoji}</span>}
            <span className="min-w-0 truncate text-white text-xs md:text-sm font-semibold drop-shadow">{title_text}</span>
          </div>
          {/* SF Symbols switch.2 (iOS immersion toggle): top outlined capsule + knob left,
              bottom filled capsule with a knocked-out knob right (evenodd hole, no mask). */}
          <svg width="23" height="16.5" viewBox="0 0 25 18" fill="none" preserveAspectRatio="xMidYMid meet" className="shrink-0 text-white" aria-hidden>
            <rect x="0.9" y="1" width="20.2" height="7" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2.6" y="2.7" width="7.2" height="3.6" rx="1.8" fill="currentColor" />
            <path
              fillRule="evenodd"
              fill="currentColor"
              d="M7.4 10 H20.6 A3.5 3.5 0 0 1 20.6 17 H7.4 A3.5 3.5 0 0 1 7.4 10 Z
                 M17.1 11.7 H20.7 A1.8 1.8 0 0 1 20.7 15.3 H17.1 A1.8 1.8 0 0 1 17.1 11.7 Z"
            />
          </svg>
        </div>
      </div>

      {/* Bottom — caption (word-level karaoke) + translation. Gradient is lighter at the
          very bottom and sustains darkness higher up so the caption stays legible. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[62%] bg-gradient-to-t from-black/60 via-black/45 to-transparent" />
      <div className="absolute inset-x-0 top-[56%] z-10 px-4">
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
