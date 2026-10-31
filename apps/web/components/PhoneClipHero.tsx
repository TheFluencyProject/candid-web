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
const PLAYBACK_RATE = 0.8;
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

// Some titles arrive with the emoji glued on ("Let's Take a Walk🍁"); space it like the rest.
function spaced_title(title: string): string {
  return title.replace(/(\S)(\p{Extended_Pictographic}[\p{Extended_Pictographic}\u200d\ufe0f]*)$/u, "$1 $2");
}

// Landscape clips get the app's vertical-format player, ported from iOS
// NativeFullScreenVideoScreen.verticalFormatBox + VerticalFormatEdgeExtend + VerticalFormatBandBlur
// (+ VerticalFormatBandTuning's defaults). The centre fills a full-width sharp box from under the
// header's bars to the stretch bar; the bands above and below stretch the box's own outermost 2pt,
// under blurs that ease in from the box edge — light on top, heavy at the bottom.
const PT = 100 / 393; // cqw per iOS point (393pt-wide iPhone)
const SCREEN_H_CQW = 216.7; // the screen cut-out is 1795:3889
const EXTEND_TOP_CQW = 28; // iOS headerBottom: just under the title row's progress bar
const EXTEND_BOTTOM_CQW = (113 + 2) * PT; // WatchStretchBarBottomPadding + StretchProgressBar.barHeight
const EXTEND_BOX_CQW = SCREEN_H_CQW - EXTEND_TOP_CQW - EXTEND_BOTTOM_CQW;
const STRIP_PT = 2; // VerticalFormatEdgeExtend.stripHeight
// VerticalFormatBandTuning defaults, in pt — except the ramps, which start further inside the box
// (iOS: rampAbove 25, topRamp 0) so the picture eases out of focus more gradually, and the bottom
// dim (iOS 0.1), heavier so the bottom darkens as it blurs.
const BAND = { topBlur: 5, topDim: 0.15, bottomBlur: 40, bottomDim: 0.25, rampAbove: 90, fullBelow: 100, topRamp: 45 };
// iOS stacks 3 backdrop blurs per band, each masked in over its own third of the ramp, layer k at
// sqrt(2k+1)/3 of the radius — so after k+1 layers the picture is blurred by (k+1)/3 of it. Here each
// layer is that cumulative blur of the picture itself, with the same mask: identical result, but
// drawn from canvases padded past every edge with real picture. (A CSS backdrop-filter samples
// black past its box, which turns a 40pt band at the screen edge into a flat dark slab.)
const BLUR_LAYERS = 3;
// The dim's ease-in along the ramp: [where, share of full].
const EASE_IN = [[0, 0], [0.25, 0.1], [0.5, 0.35], [0.75, 0.7], [1, 1]] as const;
const BAND_PX = 4; // band canvas px per cqw

// A band in screen cqw: where it sits, how far its blur ramps in from the box end, and the canvas
// padding (3σ) that keeps its blur fed with picture at every edge.
type Band = { edge: "top" | "bottom"; top: number; height: number; ramp: number; blur: number; dim: number; pad: number };
const band = (b: Omit<Band, "pad">): Band => ({ ...b, pad: Math.ceil(3 * b.blur) });
const BANDS = [
  // Full only at the screen top, none topRamp into the box.
  band({ edge: "top", top: 0, height: EXTEND_TOP_CQW + BAND.topRamp * PT, ramp: EXTEND_TOP_CQW + BAND.topRamp * PT, blur: BAND.topBlur * PT, dim: BAND.topDim }),
  // None rampAbove over the bar, full fullBelow under it.
  band({
    edge: "bottom",
    top: SCREEN_H_CQW - EXTEND_BOTTOM_CQW - BAND.rampAbove * PT,
    height: EXTEND_BOTTOM_CQW + BAND.rampAbove * PT,
    ramp: BAND.rampAbove * PT + Math.min(BAND.fullBelow * PT, EXTEND_BOTTOM_CQW),
    blur: BAND.bottomBlur * PT,
    dim: BAND.bottomDim,
  }),
];

// Paint the screen's picture — the box (same centre crop as its object-cover) and its outermost 2pt
// stretched above and below it — into the strip canvases, and into each band's padded canvases with
// the side padding clamped to the edge column. Painted from the poster until the video has a frame.
function paint_edges(src: HTMLVideoElement | HTMLImageElement, top: HTMLCanvasElement | null, bottom: HTMLCanvasElement | null, bands: (HTMLCanvasElement | null)[][]) {
  const [w, h] = src instanceof HTMLVideoElement ? [src.videoWidth, src.videoHeight] : [src.naturalWidth, src.naturalHeight];
  if (!w || !h || (src instanceof HTMLVideoElement && src.readyState < 2)) return;
  const sw = Math.min(w, (h * 100) / EXTEND_BOX_CQW);
  const sx = (w - sw) / 2;
  const rows = Math.max(1, (h * STRIP_PT * PT) / EXTEND_BOX_CQW);
  for (const [canvas, sy] of [[top, 0], [bottom, h - rows]] as const) {
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.drawImage(src, sx, sy, sw, rows, 0, 0, canvas.width, canvas.height);
  }
  const box_bottom = EXTEND_TOP_CQW + EXTEND_BOX_CQW;
  BANDS.forEach((b, i) => {
    const [first, ...copies] = bands[i];
    const ctx = first?.getContext("2d");
    if (!first || !ctx) return;
    const y0 = b.top - b.pad;
    const y1 = b.top + b.height + b.pad;
    const pad_px = b.pad * BAND_PX;
    const draw = (a: number, z: number, sy: number, sh: number) => {
      if (z > a) ctx.drawImage(src, sx, sy, sw, sh, pad_px, (a - y0) * BAND_PX, 100 * BAND_PX, (z - a) * BAND_PX);
    };
    draw(y0, Math.min(y1, EXTEND_TOP_CQW), 0, rows); // above the box: its top rows, stretched
    const a = Math.max(y0, EXTEND_TOP_CQW);
    const z = Math.min(y1, box_bottom);
    draw(a, z, ((a - EXTEND_TOP_CQW) / EXTEND_BOX_CQW) * h, ((z - a) / EXTEND_BOX_CQW) * h); // the box
    draw(Math.max(y0, box_bottom), y1, h - rows, rows); // below the box: its bottom rows, stretched
    ctx.drawImage(first, pad_px, 0, 1, first.height, 0, 0, pad_px, first.height);
    ctx.drawImage(first, first.width - pad_px - 1, 0, 1, first.height, first.width - pad_px, 0, pad_px, first.height);
    for (const c of copies) c?.getContext("2d")?.drawImage(first, 0, 0);
  });
}

// One band of VerticalFormatBandBlur: clear at the box end, eased to full over its ramp, then full
// out to the screen edge, plus the eased dim.
function BandBlur({ b, canvases }: { b: Band; canvases: (HTMLCanvasElement | null)[] }) {
  const ramp = Math.min(b.ramp / b.height, 1) * 100;
  const dir = b.edge === "top" ? "to top" : "to bottom"; // from the box end out to the screen edge
  return (
    <div aria-hidden className="absolute inset-x-0 overflow-hidden" style={{ top: `${b.top}cqw`, height: `${b.height}cqw` }}>
      {Array.from({ length: BLUR_LAYERS }, (_, k) => {
        const mask = `linear-gradient(${dir}, transparent ${(ramp * k) / BLUR_LAYERS}%, black ${(ramp * (k + 1)) / BLUR_LAYERS}%)`;
        return (
          <div key={k} className="absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask }}>
            <canvas
              ref={(el) => { canvases[k] = el; }}
              width={(100 + 2 * b.pad) * BAND_PX}
              height={(b.height + 2 * b.pad) * BAND_PX}
              className="absolute max-w-none"
              style={{
                left: `${-b.pad}cqw`,
                top: `${-b.pad}cqw`,
                width: `${100 + 2 * b.pad}cqw`,
                height: `${b.height + 2 * b.pad}cqw`,
                filter: `blur(${(b.blur * (k + 1)) / BLUR_LAYERS}cqw)`,
              }}
            />
          </div>
        );
      })}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(${dir}, ${EASE_IN.map(([at, a]) => `rgba(0,0,0,${b.dim * a}) ${ramp * at}%`).join(", ")})` }}
      />
    </div>
  );
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

// Off for now (Adam 10/31): the lone speed button reads more like shadowing. Kept to try again.
const SHOWS_BUTTON_ROW = false;

// Watch's collapsed bottom sheet (iOS VideoOverlayBar, isInSheetSmallState): speed · rewind ·
// pause · listen mode · captions, evenly spread in 55pt cells on a floating dark glass (the sheet's
// #171717 backdrop at 40%), its 80pt detent topping out ~94pt up.
function ButtonRow() {
  return (
    <div
      className="absolute inset-x-[2cqw] bottom-[2cqw] h-[22cqw] rounded-[10cqw] border border-white/[0.08] bg-[#171717]/40 [backdrop-filter:blur(6cqw)_saturate(1.4)]"
      style={{ WebkitBackdropFilter: "blur(6cqw) saturate(1.4)" }}
    >
      <div className="flex h-[14cqw] items-center px-[1cqw] pt-[2cqw] text-white">
        <span className="flex-1 text-center text-[5.1cqw] font-semibold tracking-[-0.03em] [font-stretch:condensed]">{PLAYBACK_RATE}x</span>
        <span className="flex flex-1 justify-center">
          {/* arrow.trianglehead.counterclockwise */}
          <svg viewBox="0 0 24 24" className="h-[5.8cqw]" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" aria-hidden>
            <path d="M5.2 8.3A8 8 0 1 1 4 12.5" />
            <path d="M2.6 4.4 5.6 9.2l4.9-2.6Z" fill="white" strokeLinejoin="round" strokeWidth="1.2" />
          </svg>
        </span>
        <span className="flex flex-1 justify-center">
          {/* pause.fill */}
          <svg viewBox="0 0 24 24" className="h-[5.6cqw]" fill="white" aria-hidden>
            <rect x="4.5" y="3" width="5.4" height="18" rx="1.6" />
            <rect x="14.1" y="3" width="5.4" height="18" rx="1.6" />
          </svg>
        </span>
        <span className="flex flex-1 justify-center">
          {/* play.square */}
          <svg viewBox="0 0 24 24" className="h-[5.9cqw]" fill="none" stroke="white" strokeWidth="2" aria-hidden>
            <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" />
            <path d="M9.6 7.9v8.2a.6.6 0 0 0 .9.5l6.5-4.1a.6.6 0 0 0 0-1L10.5 7.4a.6.6 0 0 0-.9.5Z" fill="white" stroke="none" />
          </svg>
        </span>
        <span className="flex flex-1 justify-center">
          {/* Phosphor subtitles (regular) */}
          <svg viewBox="0 0 256 256" className="h-[7.1cqw]" fill="white" aria-hidden>
            <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,144H32V64H224V192ZM48,136a8,8,0,0,1,8-8H72a8,8,0,0,1,0,16H56A8,8,0,0,1,48,136Zm160,0a8,8,0,0,1-8,8H104a8,8,0,0,1,0-16h96A8,8,0,0,1,208,136Zm-48,32a8,8,0,0,1-8,8H56a8,8,0,0,1,0-16h96A8,8,0,0,1,160,168Zm48,0a8,8,0,0,1-8,8H184a8,8,0,0,1,0-16h16A8,8,0,0,1,208,168Z" />
          </svg>
        </span>
      </div>
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
  const posterRef = useRef<HTMLImageElement | null>(null);
  const topEdgeRef = useRef<HTMLCanvasElement | null>(null);
  const bottomEdgeRef = useRef<HTMLCanvasElement | null>(null);
  const bandRefs = useRef<(HTMLCanvasElement | null)[][]>(BANDS.map(() => []));
  const [hasFrame, setHasFrame] = useState(false); // a decoded frame is up → poster can go
  const hasFrameRef = useRef(false);
  hasFrameRef.current = hasFrame;
  // Wider than tall → the boxed layout. Read off the poster first (same frame, so same aspect, and
  // it's up before the stream), then confirmed by the video's own size.
  const [landscape, setLandscape] = useState(false);
  const read_poster_aspect = () => {
    const img = posterRef.current;
    if (!img?.naturalWidth) return;
    setLandscape(img.naturalWidth > img.naturalHeight);
    if (!hasFrameRef.current) paint_edges(img, topEdgeRef.current, bottomEdgeRef.current, bandRefs.current);
  };
  // The poster can finish loading before hydration attaches onLoad — read it once on mount too.
  useEffect(read_poster_aspect, []);
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
    const on_frame = () => {
      if (cancelled) return;
      setHasFrame(true);
      setLandscape(video.videoWidth > video.videoHeight);
      paint_edges(video, topEdgeRef.current, bottomEdgeRef.current, bandRefs.current);
    };
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
      paint_edges(video, topEdgeRef.current, bottomEdgeRef.current, bandRefs.current);
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
  const extend = landscape;

  return (
    <div
      className={`absolute inset-0 transition-opacity ease-out ${role === "next" ? "opacity-0" : "opacity-100"}`}
      style={{ zIndex: role === "active" ? 2 : role === "prev" ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
    >
      {/* Scrims: light at the top for the status bar + title, heavy at the bottom for captions.
          Rendered over the media below via z-order. */}
      {extend ? (
        // iOS vertical-format holds the top fade's 0.5 over the band above the box, releasing
        // below the header's bars, by a quarter of the screen down.
        <div
          className="absolute inset-x-0 top-0 z-[1]"
          style={{ height: `${SCREEN_H_CQW / 4}cqw`, background: `linear-gradient(to bottom, rgba(0,0,0,0.5) ${EXTEND_TOP_CQW}cqw, transparent)` }}
        />
      ) : (
        <div className="absolute inset-x-0 top-0 z-[1] h-[50cqw] bg-gradient-to-b from-black/65 via-black/35 to-transparent" />
      )}
      {extend ? (
        // Darker and longer than iOS's bottom vignette (clear at mid-screen, 0.75 from three quarters
        // down): it starts a third of the way down and builds steadily to 0.8 at the bottom.
        <div className="absolute inset-x-0 bottom-0 z-[1] h-[66%]" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0.58) 65%, rgba(0,0,0,0.8))" }} />
      ) : (
        <div className="absolute inset-x-0 bottom-0 z-[1] h-[74%] bg-gradient-to-t from-black/95 via-black/65 to-transparent" />
      )}

      {/* Edge-extend strips (mounted always so the poster can paint into them before the layout
          knows it's landscape; shown only for the extend layout). */}
      <div aria-hidden className={extend ? "" : "hidden"}>
        <canvas ref={topEdgeRef} width={400} height={4} className="absolute inset-x-0 top-0 w-full" style={{ height: `${EXTEND_TOP_CQW}cqw` }} />
        <canvas ref={bottomEdgeRef} width={400} height={4} className="absolute inset-x-0 bottom-0 w-full" style={{ height: `${EXTEND_BOTTOM_CQW}cqw` }} />
      </div>

      {/* The clip: full screen for vertical video; for landscape, the zoomed centre in its box. */}
      <div
        className="absolute inset-x-0 overflow-hidden"
        style={extend ? { top: `${EXTEND_TOP_CQW}cqw`, bottom: `${EXTEND_BOTTOM_CQW}cqw` } : { top: 0, bottom: 0 }}
      >
        {clip.thumbnail_url && (
          // The caption segment's own first frame (Mux thumbnail at its start time).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={posterRef}
            src={clip.thumbnail_url}
            alt=""
            draggable={false}
            onLoad={read_poster_aspect}
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
      </div>

      {/* iOS VerticalFormatBandBlur, under the scrims. Mounted always, like the strips, so the poster
          can paint into it before the layout knows it's landscape. */}
      <div className={extend ? "" : "hidden"}>
        {BANDS.map((b, i) => <BandBlur key={b.edge} b={b} canvases={bandRefs.current[i]} />)}
      </div>

      {/* Lesson title row + progress */}
      <div className="absolute inset-x-0 top-[15.6cqw] z-[2] px-[6cqw]">
        <div className="flex items-center gap-[3cqw]">
          <span className="min-w-0 flex-1 truncate text-white text-[5.4cqw] font-bold leading-tight tracking-[-0.02em] [font-stretch:condensed] drop-shadow">
            {spaced_title(clip.title)}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/switch.2.svg" alt="" className="h-[5.3cqw] w-auto" />
        </div>
        <div className="mt-[2.4cqw] h-[1.8cqw] overflow-hidden rounded-full bg-white/35">
          <div className="h-full rounded-full" style={{ width: `${progress_for(clip)}%`, backgroundColor: ACCENT }} />
        </div>
      </div>

      {/* Speak now + caption + translation — top-anchored: Speak now sits at the screen's middle
          (the screen is ~217cqw tall) and longer captions grow down toward the speed button. */}
      <div className="absolute inset-x-0 top-[104cqw] z-[2] px-[6.2cqw]">
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
          {SHOWS_BUTTON_ROW ? (
            <ButtonRow />
          ) : (
            <div className="absolute right-[6.5cqw] bottom-[11cqw] flex h-[16.5cqw] w-[16.5cqw] items-center justify-center rounded-full border border-white/[0.07] bg-[#1c1c1e]/85 text-white text-[4.6cqw] font-semibold tracking-[-0.02em]">
              {PLAYBACK_RATE}x
            </div>
          )}
          <div className="absolute bottom-[1.6cqw] left-1/2 h-[1.1cqw] w-[32cqw] -translate-x-1/2 rounded-full bg-white/60" />
        </div>
      </div>

      {/* Real iPhone frame (bezel, buttons, Dynamic Island) on top — always applied. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/iphone-frame.png" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
