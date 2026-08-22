"use client";

import { Fragment, memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MarketingClip } from "@/lib/api";

// useLayoutEffect warns on the server; fall back to useEffect there (the seed it runs is client-only).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

// Poster width: the card renders ≤281px (desktop) / 191px (mobile); 640 covers retina while
// being ~3x smaller than the backend's 1200px default (sized for full-screen iOS surfaces).
// Small enough that all 12 unique posters load near-instantly — eager, so none pop in mid-drift.
const POSTER_WIDTH = 640;

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

// Shrink the Mux poster to the card's size. The size rides on a ?width= query param, so swap
// it down (or append) \u2014 leaves non-Mux/S3 fallback URLs untouched.
function poster_url(url: string): string {
  return /[?&]width=\d+/.test(url)
    ? url.replace(/([?&]width=)\d+/, `$1${POSTER_WIDTH}`)
    : url;
}

type Props = {
  clip: MarketingClip;
  dataKey: string;
  isActive: boolean;
  /** Load the video only when the card is near the viewport — bounds simultaneous
   *  <video> elements so mobile (hard media-element limit) doesn't drop later cards. */
  shouldLoad: boolean;
  onSegmentEnd: () => void;
  /** Fires when the active video actually starts playing — lets the marquee defer
   *  neighbor prebuffering until the first clip is established (mobile cold-start). */
  onReady: () => void;
  /** Apple-Music karaoke captions + Speak-now pill + darker bg (the default). `?karaoke=0` → false. */
  karaoke?: boolean;
  /** Global volume toggle (marquee-owned). Default true (muted); only the active card emits audio. */
  muted?: boolean;
  /** Freeze playback while the in-app-browser blocker modal is open — keeps TikTok's webview from
   *  auto-fullscreening the inline video behind the modal. */
  frozen?: boolean;
  /** Restricted webview: don't render the <video> element at all. An empty media element is still
   *  tappable and summons the native (black) fullscreen player in webviews that don't allow inline
   *  playback — only the drifting poster is safe to show there. */
  posterOnly?: boolean;
};

function MarketingClipCard({ clip, dataKey, isActive, shouldLoad, onSegmentEnd, onReady, karaoke = true, muted = true, frozen = false, posterOnly = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [ready, setReady] = useState(false); // first frame buffered → fade video over poster
  // Stories-style bar: a seeded random start fill (≤90%) that creeps forward a little while
  // the clip plays. NOT reset on deactivate, so a card holds its fill where it stopped.
  const start_fill = 0.15 + seeded_unit(clip.caption_segment_id) * 0.75;
  const [progress, setProgress] = useState(start_fill);
  // Live playback position (absolute video time) driving the karaoke reveal. Separate from
  // activeWordIdx so the classic path's frozen captions stay unchanged.
  const [playhead, setPlayhead] = useState(clip.start_time);

  const onSegmentEndRef = useRef(onSegmentEnd);
  onSegmentEndRef.current = onSegmentEnd;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const mutedRef = useRef(muted); // read in play_from_start so a toggle doesn't restart playback
  mutedRef.current = muted;
  const frozenRef = useRef(frozen); // read in play_from_start / on_ready so a frozen card never plays
  frozenRef.current = frozen;

  const play_from_start = (video: HTMLVideoElement) => {
    if (frozenRef.current) return; // blocker modal is up — don't start (would fullscreen in TikTok)
    // iOS: React's `muted`/`playsInline` props don't reliably set the real state — force them
    // imperatively before play(). Defaults muted (autoplay allowed); the user's unmute tap is the
    // gesture that lets later clips start with sound.
    video.muted = mutedRef.current;
    video.playsInline = true;
    try { video.currentTime = clip.start_time; } catch { /* not seekable yet */ }
    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
    video.play().then(() => {
      video.playbackRate = PLAYBACK_RATE; // re-assert: starting playback can reset it to 1
      setReady(true);
      onReadyRef.current(); // active clip is established → marquee may now prebuffer neighbors
    }).catch((err: DOMException) => {
      // A MUTED inline autoplay denial is the restricted-webview signature (TikTok-style: inline
      // playback disallowed, so the clip sits on its first frame and a later gesture-adjacent
      // play() would open the native fullscreen player) — or an autoplay-off policy (Low Power
      // Mode, user setting), where posters are the right fallback anyway. Tell the marquee to
      // drop to poster-only BEFORE any tap can hand the webview a video to fullscreen. Unmuted
      // denials are ordinary audio policy — leave those alone.
      if (video.muted && video.currentSrc && err?.name === "NotAllowedError") {
        window.dispatchEvent(new CustomEvent("candid:autoplay-blocked"));
      }
    });
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
      // Recycle like a LazyHStack: a card torn down off-screen resets its karaoke progress
      // so it returns as a fresh (dim) preview, not frozen-lit.
      setPlayhead(clip.start_time);
      setProgress(start_fill);
      setActiveWordIdx(-1);
    };
  }, [shouldLoad, clip]);

  // Play only while active; pause IN PLACE otherwise (freeze on the current/last frame —
  // no rewind, so a finished or interrupted clip rests where it stopped). Karaoke + end via rAF.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive || frozen) {
      video.pause(); // freeze on the current frame — do NOT rewind to start
      if (frozen) {
        // TikTok's webview may have already forced this video into native fullscreen; kick it back
        // out so it stops covering the blocker modal.
        const v = video as HTMLVideoElement & {
          webkitDisplayingFullscreen?: boolean;
          webkitExitFullscreen?: () => void;
        };
        if (v.webkitDisplayingFullscreen) v.webkitExitFullscreen?.();
      }
      return;
    }

    let raf = 0;
    let cancelled = false;
    play_from_start(video); // no-op until loaded; on_ready re-fires play once buffered

    const tick = () => {
      if (cancelled) return;
      if (video.playbackRate !== PLAYBACK_RATE) video.playbackRate = PLAYBACK_RATE; // hls/seek can reset it
      if (video.paused && video.readyState >= 2) {
        // Re-assert if play stalled/was blocked. NOTE: in a restricted webview this retry is the
        // fullscreen vector — the call landing inside a tap gesture inherits its activation and
        // "succeeds" straight into the native player. The muted-denial dispatch (see
        // play_from_start) flips the marquee to poster-only before that can happen.
        video.play().catch((err: DOMException) => {
          if (video.muted && video.currentSrc && err?.name === "NotAllowedError") {
            window.dispatchEvent(new CustomEvent("candid:autoplay-blocked"));
          }
        });
      }
      const t = video.currentTime;
      setPlayhead(t);
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
  }, [isActive, clip, frozen]);

  // On first load, show cards left of the viewport centre as already-played (captions fully lit)
  // so the row looks mid-stream, not all-dim. Runs once; play/recycle logic takes over after.
  useIsomorphicLayoutEffect(() => {
    const card = videoRef.current?.closest("[data-key]");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    if (rect.right > 0 && rect.left + rect.width / 2 < window.innerWidth / 2) {
      setPlayhead(clip.end_time);
    }
  }, []);

  // Live volume: only the active card emits audio; everything else stays muted. Set the element
  // property directly — React's `muted` attribute doesn't reliably reflect to the DOM.
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted || !isActive;
  }, [muted, isActive]);

  // Marquee videos must NEVER stay fullscreen, wherever this card is embedded. Some webviews
  // (allowsInlineMediaPlayback = false) ignore playsInline and force-fullscreen a clip the moment
  // it plays. On begin: freeze every card via the marquee (src STAYS attached — unloading a video
  // mid-transition strands an empty black native player) and repeatedly kick the video back
  // inline (an exit call during the begin transition is ignored by WebKit, so retry until it
  // sticks). Only once the webview reports the fullscreen ended does the marquee drop to
  // poster-only and unload the videos for good.
  useEffect(() => {
    const video = videoRef.current as (HTMLVideoElement & {
      webkitDisplayingFullscreen?: boolean;
      webkitExitFullscreen?: () => void;
      webkitSetPresentationMode?: (mode: string) => void;
    }) | null;
    if (!video) return;
    // React's `playsInline` prop only emits `playsinline`; some webviews honor only `webkit-playsinline`.
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const on_begin = () => {
      video.pause();
      window.dispatchEvent(new CustomEvent("candid:fullscreen-hijack"));
      let tries = 0;
      const kick = () => {
        if (video.webkitDisplayingFullscreen) {
          try { video.webkitSetPresentationMode?.("inline"); } catch { /* mode unsupported */ }
          video.webkitExitFullscreen?.();
        }
        if (++tries < 20) timer = setTimeout(kick, 120);
      };
      kick();
    };
    const on_end = () => {
      if (timer) clearTimeout(timer);
      window.dispatchEvent(new CustomEvent("candid:fullscreen-ended"));
    };
    video.addEventListener("webkitbeginfullscreen", on_begin);
    video.addEventListener("webkitendfullscreen", on_end);
    return () => {
      if (timer) clearTimeout(timer);
      video.removeEventListener("webkitbeginfullscreen", on_begin);
      video.removeEventListener("webkitendfullscreen", on_end);
    };
  }, [posterOnly]); // re-attach when the <video> mounts/unmounts with poster-only mode

  const words = clip.word_level_captions;
  const title_text = strip_emoji(clip.title);

  return (
    <div
      data-key={dataKey}
      data-clip-id={clip.caption_segment_id}
      // isolate: own stacking context so the overlay layers always paint above the
      // <video> (mobile promotes playing video to its own layer otherwise).
      // overflow-hidden+rounded is the ONLY round-clip; media stays square (a rounded video layer paints a white corner AA).
      className="relative isolate h-[340px] md:h-[500px] aspect-[9/16] shrink-0 overflow-hidden rounded-[1.25rem] shadow-[0_4px_20px_rgba(0,0,0,0.22)] select-none bg-black"
    >
      {/* Poster stays mounted: instant paint + stable width before the video buffers. Eager +
          shrunk (POSTER_WIDTH): the 12 unique posters load up front so none pop in as the row
          drifts, yet they're small enough not to starve the cold first-clip load. */}
      {clip.thumbnail_url && (
        <img src={poster_url(clip.thumbnail_url)} alt="" draggable={false} decoding="async" className="absolute inset-0 z-0 h-full w-full object-cover" />
      )}
      {/* pointer-events-none: the video is purely presentational (no controls; the marquee owns
          dragging) — a tap that reaches a media element makes restricted webviews open the native
          fullscreen player, even for an empty video. Not rendered at all in poster-only mode. */}
      {!posterOnly && (
        <video
          ref={videoRef}
          muted={muted || !isActive}
          playsInline
          preload="auto"
          className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}

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

      {/* Bottom — caption (word-level karaoke) + translation. The fade runs all the way to solid
          black and holds it for the last 6%, so no video colour survives at the card's bottom edge
          (a partly-transparent bottom stop leaves a bright band there); it then sustains darkness
          higher up so the caption stays legible. */}
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[62%] bg-gradient-to-t to-transparent from-black from-[6%] ${karaoke ? "via-black/70" : "via-black/45"}`} />
      {/* always-mounted + opacity so it fades OUT too; gated on isActive → one playing card at a time */}
      {karaoke && (
        <div className={`pointer-events-none absolute inset-x-0 top-[56%] z-20 flex justify-center -translate-y-[calc(100%+8px)] md:-translate-y-[calc(100%+12px)] transition-opacity duration-300 ease-out ${isActive && ready ? "opacity-100" : "opacity-0"}`}>
          {/* size tracks the card: smaller on the 340px mobile card, larger on the 500px desktop one */}
          <span className="inline-block rounded-md px-2 py-1 md:px-2.5 text-xs md:text-base font-semibold leading-tight text-black shadow" style={{ backgroundColor: KARAOKE_ACCENT }}>
            Speak now
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 top-[56%] z-10 px-4">
        <p className="text-white text-[1.35rem] md:text-[1.6875rem] font-bold leading-tight drop-shadow">
          {karaoke ? (
            words && words.length > 0 ? (
              words.map((w, i) => {
                const next = words[i + 1];
                // extend a word's sweep into a tight (<0.2s) gap so it doesn't stall between words (iOS parity)
                const eff_end = next && next.start_time - w.end_time < 0.2 ? next.start_time : w.end_time;
                const fill = Math.min(1, Math.max(0, (playhead - w.start_time) / Math.max(0.0001, eff_end - w.start_time)));
                return (
                  <Fragment key={i}>
                    {/* dim base + full overlay revealed left→right; fill from live currentTime each frame
                        (not a CSS anim) so it can't drift from the video and freezes if it buffers */}
                    <span className="relative inline-block align-baseline">
                      <span style={{ color: KARAOKE_ACCENT, opacity: 0.6 }}>{w.text}</span>
                      <span aria-hidden className="absolute inset-0" style={{ color: KARAOKE_ACCENT, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}>{w.text}</span>
                    </span>
                    {i < words.length - 1 ? " " : ""}{/* real space node so the line still wraps between words */}
                  </Fragment>
                );
              })
            ) : (
              <span style={{ color: KARAOKE_ACCENT }}>{clip.text}</span>
            )
          ) : words && words.length > 0 ? (
            words.map((w, i) => (
              <span key={i} style={i === activeWordIdx ? { color: KARAOKE_ACCENT } : undefined}>
                {w.text}{i < words.length - 1 ? " " : ""}
              </span>
            ))
          ) : (
            clip.text
          )}
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
