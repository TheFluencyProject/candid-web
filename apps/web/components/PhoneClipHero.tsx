"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { MarketingClip } from "@/lib/api";
import { isRestrictedInAppBrowser } from "@/lib/platform";

// The tutor-page hero for tutors with no uploaded Shadow screenshot: the iOS shadowing screen,
// drawn live from the tutor's starred clips inside a real iPhone frame. Layout numbers are
// measured off Mia's uploaded screenshot (the look this mirrors) and expressed in cqw —
// percent of the screen's width — so the whole screen scales as one picture.

// iOS AccentColor (display-p3 0x89/0xFF/0xB4) — karaoke sweep, Speak-now pill, progress bar.
const ACCENT = "#89FFB4";
// The app's slowed shadowing speed; shown on the speed button.
const PLAYBACK_RATE = 0.7;
// Rest on the last frame, caption fully lit, before the next clip fades in over it.
const END_HOLD_MS = 600;
// The next clip's fade-in; it rests on its first frame until the fade is done, then plays.
const FADE_MS = 700;

// /iphone-frame.png is 1000x2034 with a transparent screen cut out at (101,84)-(1896,3973),
// corner radius 250, on its 2000x4068 source. These place the live screen under that hole.
const SCREEN_STYLE = {
  left: "5.05%",
  top: "2.065%",
  width: "89.75%",
  height: "95.6%",
  borderRadius: "13.9% / 6.43%",
} as const;

// A fixed lesson-progress fill per clip (20–75%), from its id so SSR and client agree and each
// clip lands somewhere different. It never moves during playback.
function progress_for(clip: MarketingClip): number {
  let h = 0;
  for (const ch of clip.caption_segment_id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 20 + (h % 56);
}

function StatusIcons() {
  return (
    <div className="flex items-center gap-[1.4cqw]">
      {/* cellular */}
      <svg viewBox="0 0 18 12" className="h-[2.4cqw]" fill="white" aria-hidden>
        <rect x="0" y="8" width="3" height="4" rx="0.8" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
        <rect x="10" y="3" width="3" height="9" rx="0.8" />
        <rect x="15" y="0" width="3" height="12" rx="0.8" />
      </svg>
      {/* wifi */}
      <svg viewBox="0 0 16 12" className="h-[2.4cqw]" fill="white" aria-hidden>
        <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.3-1.3A10.3 10.3 0 0 0 8 .3C5.2.3 2.6 1.4.7 3.3L2 4.6a8.5 8.5 0 0 1 6-2.4Z" />
        <path d="M8 5.9c1.3 0 2.5.5 3.4 1.3l1.3-1.3A6.6 6.6 0 0 0 8 4c-1.8 0-3.5.7-4.7 1.9l1.3 1.3c.9-.8 2.1-1.3 3.4-1.3Z" />
        <path d="M8 9.6 10 7.8a3 3 0 0 0-4 0Z" transform="translate(0 1.4)" />
      </svg>
      {/* battery */}
      <svg viewBox="0 0 27 12.5" className="h-[2.5cqw]" aria-hidden>
        <rect x="0.5" y="0.5" width="23" height="11.5" rx="3.6" fill="none" stroke="white" strokeOpacity="0.4" />
        <rect x="2" y="2" width="20" height="8.5" rx="2.3" fill="white" />
        <path d="M25 4.2v4.1c.8-.3 1.4-1.1 1.4-2s-.6-1.8-1.4-2.1Z" fill="white" fillOpacity="0.45" />
      </svg>
    </div>
  );
}

type LayerRole = "prev" | "active" | "next";

type LayerProps = {
  clip: MarketingClip;
  // "next" preloads hidden underneath; "active" plays on top (fading in over "prev", which stays
  // frozen on its last frame beneath until the fade completes).
  role: LayerRole;
  posterOnly: boolean;
  onEnd: () => void;
};

// One clip's whole screen — video, scrims, title row, Speak now + caption — so a clip change
// crossfades everything together.
function ClipLayer({ clip, role, posterOnly, onEnd }: LayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasFrame, setHasFrame] = useState(false); // a decoded frame is up → poster can go
  const [ready, setReady] = useState(false); // stream attached + seekable
  const [playhead, setPlayhead] = useState(clip.start_time); // absolute clip time driving the sweep
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  // Was this layer preloaded hidden? Then it fades in when it goes active and must wait for that.
  const fadesInRef = useRef(role === "next");

  // Load (and buffer) as soon as the layer mounts — "next" layers preload while the current clip
  // plays, so the fade-in starts on a moving picture instead of a still poster.
  useEffect(() => {
    if (posterOnly) return;
    const video = videoRef.current;
    if (!video) return;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.muted = true; // iOS: set imperatively — the prop doesn't reliably reach the element
    // 1080p, not the marquee's 720p cap: landscape sources are cropped to a tall sliver here,
    // so the screen shows only ~45% of the frame's width and needs the extra pixels to stay sharp.
    const src = `https://stream.mux.com/${clip.mux_playback_id}.m3u8?max_resolution=1080p`;
    let hls: import("hls.js").default | null = null;
    let cancelled = false;
    const on_frame = () => { if (!cancelled) setHasFrame(true); };
    video.addEventListener("loadeddata", on_frame);
    video.addEventListener("playing", on_frame);
    const on_ready = () => {
      if (cancelled) return;
      try { video.currentTime = clip.start_time; } catch { /* not seekable yet */ }
      setReady(true);
    };

    import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (Hls.isSupported()) {
        hls = new Hls({ startPosition: clip.start_time });
        hls.on(Hls.Events.MANIFEST_PARSED, on_ready);
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", on_ready, { once: true });
      }
    }).catch(() => {});

    // A webview that fullscreens anyway: pull it back inline; the marquee's listener (and the
    // hero's, on fullscreen-ended) then drops the page to posters.
    const v = video as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean; webkitExitFullscreen?: () => void };
    const on_begin = () => {
      video.pause();
      window.dispatchEvent(new CustomEvent("candid:fullscreen-hijack"));
      if (v.webkitDisplayingFullscreen) v.webkitExitFullscreen?.();
    };
    const on_end = () => window.dispatchEvent(new CustomEvent("candid:fullscreen-ended"));
    video.addEventListener("webkitbeginfullscreen", on_begin);
    video.addEventListener("webkitendfullscreen", on_end);

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", on_frame);
      video.removeEventListener("playing", on_frame);
      video.removeEventListener("webkitbeginfullscreen", on_begin);
      video.removeEventListener("webkitendfullscreen", on_end);
      if (hls) hls.destroy();
      video.removeAttribute("src");
    };
  }, [clip, posterOnly]);

  // Play once while active: sweep the caption, stop on the last frame, report the end.
  useEffect(() => {
    const video = videoRef.current;
    if (role !== "active" || !ready || !video) return;
    let raf = 0;
    let done = false;
    try { video.currentTime = clip.start_time; } catch { /* not seekable yet */ }
    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
    const start = () => {
      video.play().then(() => {
        video.playbackRate = PLAYBACK_RATE; // starting playback can reset it to 1
      }).catch((err: DOMException) => {
        // Muted autoplay denied = restricted webview or autoplay off → poster only (see marquee).
        if (video.currentSrc && err?.name === "NotAllowedError") {
          window.dispatchEvent(new CustomEvent("candid:autoplay-blocked"));
        }
      });
      raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      if (video.playbackRate !== PLAYBACK_RATE) video.playbackRate = PLAYBACK_RATE; // hls/seek can reset it
      const t = video.currentTime;
      if (t >= clip.start_time) setPlayhead(t);
      if (t >= clip.end_time) {
        video.pause();
        done = true;
        onEndRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const wait = setTimeout(start, fadesInRef.current ? FADE_MS : 0);
    return () => {
      clearTimeout(wait);
      cancelAnimationFrame(raf);
      if (!done) video.pause();
    };
  }, [role, ready, clip]);

  const words = clip.word_level_captions;

  return (
    <div
      className={`absolute inset-0 transition-opacity ease-out ${role === "next" ? "opacity-0" : "opacity-100"}`}
      style={{ zIndex: role === "active" ? 2 : role === "prev" ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
    >
      {clip.thumbnail_url && (
        // The caption segment's own first frame (Mux thumbnail at its start time).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={clip.thumbnail_url}
          alt=""
          draggable={false}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${hasFrame && !posterOnly ? "opacity-0" : "opacity-100"}`}
        />
      )}
      {!posterOnly && (
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${hasFrame ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* Scrims: light at the top for the status bar + title, heavy at the bottom for captions. */}
      <div className="absolute inset-x-0 top-0 h-[40cqw] bg-gradient-to-b from-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[74%] bg-gradient-to-t from-black/95 via-black/65 to-transparent" />

      {/* Lesson title row + progress */}
      <div className="absolute inset-x-0 top-[15.6cqw] px-[6cqw]">
        <div className="flex items-center gap-[3cqw]">
          <span className="min-w-0 flex-1 truncate text-white text-[5.4cqw] font-bold leading-tight tracking-[-0.02em] [font-stretch:condensed] drop-shadow">
            {clip.title}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/switch.2.svg" alt="" className="h-[5.3cqw] w-auto" />
        </div>
        <div className="mt-[2.4cqw] h-[1.8cqw] overflow-hidden rounded-full bg-white/35">
          <div className="h-full rounded-full" style={{ width: `${progress_for(clip)}%`, backgroundColor: ACCENT }} />
        </div>
      </div>

      {/* Speak now + caption + translation — bottom-anchored like the app. */}
      <div className="absolute inset-x-0 bottom-[50cqw] px-[6.2cqw]">
        <div className="mb-[6.6cqw] flex justify-center">
          <span className="rounded-[2.8cqw] px-[4.6cqw] py-[2.6cqw] text-[4.8cqw] font-semibold leading-none text-black" style={{ backgroundColor: ACCENT }}>
            Speak now
          </span>
        </div>
        <p className="text-[11.5cqw] font-bold leading-[1.13] tracking-[-0.01em]">
          {words && words.length > 0 ? (
            words.map((w, i) => {
              const next = words[i + 1];
              // carry a word's sweep across a tight (<0.2s) gap so it doesn't stall (iOS parity)
              const eff_end = next && next.start_time - w.end_time < 0.2 ? next.start_time : w.end_time;
              const fill = Math.min(1, Math.max(0, (playhead - w.start_time) / Math.max(0.0001, eff_end - w.start_time)));
              return (
                <Fragment key={i}>
                  <span className="relative inline-block align-baseline">
                    <span style={{ color: ACCENT, opacity: 0.5 }}>{w.text}</span>
                    <span aria-hidden className="absolute inset-0" style={{ color: ACCENT, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}>{w.text}</span>
                  </span>
                  {i < words.length - 1 ? " " : ""}
                </Fragment>
              );
            })
          ) : (
            <span style={{ color: ACCENT }}>{clip.text}</span>
          )}
        </p>
        {clip.translation && clip.translation !== clip.text && (
          <p className="mt-[5.4cqw] text-white text-[5cqw] font-normal leading-[1.3]">{clip.translation}</p>
        )}
      </div>
    </div>
  );
}

type Props = {
  /** The tutor's starred clips, played in turn. One clip plays once and rests on its end. */
  clips: MarketingClip[];
  alt: string;
};

export default function PhoneClipHero({ clips, alt }: Props) {
  // seq counts plays (clip = clips[seq % n]); layers are keyed by seq, so with 2 clips the
  // outgoing and preloading layers are separate videos even though they show the same clip.
  const [seq, setSeq] = useState(0);
  const [endedSeq, setEndedSeq] = useState(-1);
  // Restricted in-app webviews force-fullscreen any playing <video>; there, only the poster shows.
  // UA-sniffed after mount (SSR-safe), and flipped at runtime by the same window events the
  // marquee further down this page uses.
  const [posterOnly, setPosterOnly] = useState(false);
  useEffect(() => {
    setPosterOnly(isRestrictedInAppBrowser());
    const on_blocked = () => setPosterOnly(true);
    window.addEventListener("candid:autoplay-blocked", on_blocked);
    window.addEventListener("candid:fullscreen-ended", on_blocked);
    return () => {
      window.removeEventListener("candid:autoplay-blocked", on_blocked);
      window.removeEventListener("candid:fullscreen-ended", on_blocked);
    };
  }, []);

  // A clip finished → brief hold on its last frame, then the next one fades in over it.
  useEffect(() => {
    if (endedSeq !== seq || clips.length < 2) return;
    const t = setTimeout(() => setSeq(seq + 1), END_HOLD_MS);
    return () => clearTimeout(t);
  }, [endedSeq, seq, clips.length]);

  const seqs = clips.length > 1 && !posterOnly ? [seq - 1, seq, seq + 1].filter((s) => s >= 0) : [seq];

  return (
    <div className="relative w-full aspect-[1000/2034] select-none" role="img" aria-label={alt}>
      {/* Live screen, under the frame's transparent cut-out. Its own black bg fills any sliver. */}
      <div
        className="absolute isolate overflow-hidden bg-black [container-type:inline-size]"
        style={{ ...SCREEN_STYLE, WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
      >
        {seqs.map((s) => (
          <ClipLayer
            key={s}
            clip={clips[s % clips.length]}
            role={s < seq ? "prev" : s === seq ? "active" : "next"}
            posterOnly={posterOnly}
            onEnd={() => setEndedSeq(s)}
          />
        ))}

        {/* Fixed chrome over every layer. */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-x-0 top-[2.6cqw] flex items-center justify-between pl-[8.8cqw] pr-[8.6cqw]">
            <span className="text-white text-[3.9cqw] font-semibold leading-none tracking-tight">9:41</span>
            <StatusIcons />
          </div>
          <div className="absolute right-[6.5cqw] bottom-[11cqw] flex h-[16.5cqw] w-[16.5cqw] items-center justify-center rounded-full border border-white/15 bg-[#1c1c1e]/85 text-white text-[4.6cqw] font-semibold tracking-[-0.02em]">
            {PLAYBACK_RATE}x
          </div>
          <div className="absolute bottom-[1.6cqw] left-1/2 h-[1.1cqw] w-[32cqw] -translate-x-1/2 rounded-full bg-white/60" />
        </div>
      </div>

      {/* Real iPhone frame (bezel, buttons, Dynamic Island) on top — always applied. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/iphone-frame.png" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
