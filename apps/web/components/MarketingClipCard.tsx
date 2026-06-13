"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { MarketingClip } from "@/lib/api";

// iOS AccentColor (display-p3 0x89/0xFF/0xB4) — the karaoke word sweep, by role not appearance.
const KARAOKE_ACCENT = "#89FFB4";

// Clips feel rushed at 1x. hls.js / seeks can reset the element's rate, so this is
// re-asserted on play() and every rAF tick (see below), not just set once.
const PLAYBACK_RATE = 0.8;

// Mux Data env key — public/client-safe (like the PostHog key). From Mux → Settings → Data. Empty = off.
const MUX_DATA_ENV_KEY = "cgtcg54i9amt7o6nidcm9g8di";
// Sample ~15% of page loads (rolled once): the always-on marquee would otherwise log a Mux view on
// every visit. Gates SDK download + monitoring together, so unsampled visits pay nothing.
const MUX_SAMPLE = typeof window !== "undefined" && Math.random() < 0.15;

// How far the stories bar creeps forward over one clip's playback — small on purpose.
const PROGRESS_ADVANCE = 0.025;

// Deterministic pseudo-random in [0,1) from a string — stable across SSR/client so the
// per-card story-bar start fill doesn't cause a hydration mismatch.
function seeded_unit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

// Strip emoji (plus skin-tone modifiers, regional indicators, ZWJ, variation
// selectors, keycap) from a title so the chrome stays clean — no emoji shown.
function strip_emoji(title: string): string {
  const re = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}\u200D\uFE0F\u20E3]/gu;
  return title.replace(re, "").replace(/\s+/g, " ").trim();
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

function MarketingClipCard({ clip, dataKey, isActive, shouldLoad, onSegmentEnd }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [ready, setReady] = useState(false); // first frame buffered → fade video over poster
  // Stories-style bar: a seeded random start fill (≤90%) that creeps forward a little while
  // the clip plays. NOT reset on deactivate, so a card holds its fill where it stopped.
  const start_fill = 0.15 + seeded_unit(clip.caption_segment_id) * 0.75;
  const [progress, setProgress] = useState(start_fill);

  const onSegmentEndRef = useRef(onSegmentEnd);
  onSegmentEndRef.current = onSegmentEnd;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const play_from_start = (video: HTMLVideoElement) => {
    try { video.currentTime = clip.start_time; } catch { /* not seekable yet */ }
    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
    video.play().then(() => {
      video.playbackRate = PLAYBACK_RATE; // re-assert: starting playback can reset it to 1
      setReady(true);
    }).catch(() => {});
  };

  // Load (prebuffer) the video only while near the viewport; attach once, tear down when
  // it scrolls away. Keeps the live <video> count low enough for mobile media limits.
  useEffect(() => {
    if (!shouldLoad) return;
    const video = videoRef.current;
    if (!video) return;

    // Cap renditions (drops 1080p+) so the small marquee card loads fast on mobile — applies to
    // BOTH native iOS HLS and hls.js. Verified Mux accepts the param.
    const src = `https://stream.mux.com/${clip.mux_playback_id}.m3u8?max_resolution=720p`;
    const playerInitTime = Date.now(); // before load → accurate Mux "player startup time"
    const wantMux = !!MUX_DATA_ENV_KEY && MUX_SAMPLE;
    // caption_segment_id (not dataKey) so the marquee's two copies of a clip dedupe to one Mux video.
    const muxData = {
      env_key: MUX_DATA_ENV_KEY,
      player_name: "marketing-clip-marquee",
      player_init_time: playerInitTime,
      video_id: clip.caption_segment_id,
      video_title: clip.title,
      video_series: clip.tutor_name,
      video_stream_type: "on-demand",
    };
    let hls: import("hls.js").default | null = null;
    let cancelled = false;
    const on_ready = () => {
      if (cancelled) return;
      try { video.currentTime = clip.start_time; } catch { /* ignore */ }
      setReady(true);
      if (isActiveRef.current) play_from_start(video); // already active when it finished loading
    };

    // Prefer hls.js (MSE); native HLS is the Safari/iOS-only fallback. mux-embed loads only when sampled.
    Promise.all([
      import("hls.js"),
      wantMux ? import("mux-embed") : Promise.resolve(null),
    ]).then(([{ default: Hls }, muxMod]) => {
      if (cancelled) return;
      const mux = muxMod?.default;
      if (Hls.isSupported()) {
        hls = new Hls({
          startPosition: clip.start_time,
          maxBufferLength: Math.ceil(clip.end_time - clip.start_time) + 4,
          startLevel: 0, // start at the lowest rendition → fast first frame, then ABR upgrades
          capLevelToPlayerSize: true, // never fetch a rendition bigger than the small card needs
        });
        hls.on(Hls.Events.MANIFEST_PARSED, on_ready);
        hls.loadSource(src);
        hls.attachMedia(video);
        mux?.monitor(video, { hlsjs: hls, Hls, data: muxData });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", on_ready, { once: true });
        mux?.monitor(video, { data: muxData }); // Safari native HLS: no hls.js instance to pass
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
      (video as { mux?: { destroy(): void } }).mux?.destroy(); // before hls.destroy() — mux hooks hls events; no-op if unattached
      if (hls) hls.destroy();
      video.removeAttribute("src");
      setReady(false);
    };
  }, [shouldLoad, clip]);

  // Play only while active; pause IN PLACE otherwise (freeze on the current/last frame —
  // no rewind, so a finished or interrupted clip rests where it stopped). Karaoke + end via rAF.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      video.pause(); // freeze on the current frame — do NOT rewind to start
      return;
    }

    let raf = 0;
    let cancelled = false;
    play_from_start(video); // no-op until loaded; on_ready re-fires play once buffered

    const tick = () => {
      if (cancelled) return;
      if (video.playbackRate !== PLAYBACK_RATE) video.playbackRate = PLAYBACK_RATE; // hls/seek can reset it
      if (video.paused && video.readyState >= 2) video.play().catch(() => {}); // re-assert if play stalled/was blocked
      const t = video.currentTime;
      const dur = clip.end_time - clip.start_time;
      if (dur > 0) setProgress(start_fill + PROGRESS_ADVANCE * Math.min(1, Math.max(0, (t - clip.start_time) / dur)));
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
        try { video.currentTime = clip.end_time; } catch { /* ignore */ } // rest on the last frame
        video.pause();
        onSegmentEndRef.current(); // play once, then the marquee hands off to the centered card
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
      // leave progress where it stopped — the bar matches the frozen frame
    };
  }, [isActive, clip]);

  const words = clip.word_level_captions;
  const title_text = strip_emoji(clip.title);

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

      {/* Top chrome — title + toggle icon, with the stories-style progress bars below it. */}
      <div className="absolute inset-x-0 top-0 z-10 px-4 pt-3 pb-6 bg-gradient-to-b from-black/45 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-white text-sm md:text-base font-semibold drop-shadow">{title_text}</span>
          {/* SF Symbols switch.2 (iOS immersion toggle) — the exact asset from /public.
              Sized a touch smaller than the title text. */}
          <img src="/switch.2.svg" alt="" aria-hidden draggable={false} className="shrink-0 h-[13px] w-[13px] md:h-[15px] md:w-[15px] drop-shadow" />
        </div>
        {/* Progress bars UNDER the title; the fill tracks the clip's actual playback position. */}
        <div className="mt-1.5 flex gap-1">
          {[0, 1, 2].map((i) => {
            const fill = Math.max(0, Math.min(1, (progress - i / 3) * 3));
            return (
              <div key={i} className="h-[4px] flex-1 overflow-hidden rounded-full bg-white/30">
                <div className="h-full rounded-full bg-white" style={{ width: `${fill * 100}%` }} />
              </div>
            );
          })}
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

// memo: during a drag the marquee re-renders every frame as the centered card changes;
// without this all cards would re-render each frame and jank the detection/playback on mobile.
export default memo(MarketingClipCard);
