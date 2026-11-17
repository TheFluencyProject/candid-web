"use client";

import { useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import type { MarketingClip } from "@/lib/api";
import { isRestrictedInAppBrowser } from "@/lib/platform";
import { cover_position_x } from "@/lib/clip-crop";
import { ACCENT, SCREEN_STYLE, StatusIcons } from "@/components/PhoneClipHero";
import DownloadCta from "@/components/DownloadCta";

// Home "Speak Korean like a native would": App Store screenshot 4 brought to life (mockup
// tmp/tutor-roster-mockups/section-shadow.html, plan plans/landing-shadow-section-2026-11-17.md).
// The speak card floats out past an iPhone's edges; each card plays its line once with "Speak now"
// up while the record button records, then slides away and the card peeking under it moves up.
// One word near the line's end hides under the app's blur cover until the tutor reaches it.
// Card geometry (% of the phone's width) and every color/radius live in globals.css (.sd-*).

const PLAYBACK_RATE = 0.8; // the app's slowed shadowing speed
const MOVE_MS = 700; // card swap
const STOP_AFTER_MS = 300; // the record button stops this long after the line ends
const HOLD_MS = 900; // then the finished card holds before the next one comes up
const READY_TIMEOUT_MS = 5000;
const CARD_ASPECT = 109 / 131; // .sd-cards box, w/h

// Lines of 3 words or fewer hide the last word; longer lines the second-to-last.
const hidden_index = (n: number) => (n <= 3 ? n - 1 : n - 2);
const poster_url = (c: MarketingClip) => `https://image.mux.com/${c.mux_playback_id}/thumbnail.jpg?time=${c.start_time}&width=900`;

type Card = {
  clip: MarketingClip;
  el: HTMLDivElement;
  video: HTMLVideoElement;
  lits: HTMLElement[];
  cover: HTMLElement | null;
  hls: Hls | null;
  wanted: boolean; // attach asked for and not since detached (hls.js loads async)
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// rAF, with a timer fallback so a line still ends (and its video pauses) where rAF is throttled.
function frame(fn: () => void) {
  let done = false;
  const go = () => {
    if (!done) {
      done = true;
      fn();
    }
  };
  requestAnimationFrame(go);
  setTimeout(go, 50);
}

// Karaoke fill per word at clip time t, and the hidden word's cover lifts once t reaches it.
function paint(card: Card, t: number) {
  const words = card.clip.word_level_captions ?? [];
  const hidden = hidden_index(words.length);
  words.forEach((w, i) => {
    const f = Math.max(0, Math.min(1, (t - w.start_time) / Math.max(0.05, w.end_time - w.start_time)));
    card.lits[i]?.style.setProperty("--f", String(f));
    if (i === hidden) card.cover?.classList.toggle("sd-off", t >= w.start_time);
  });
}

function attach(card: Card) {
  card.wanted = true;
  if (card.hls || card.video.getAttribute("src")) return;
  const { clip, video } = card;
  video.muted = true; // iOS: set imperatively, the prop doesn't reliably reach the element
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  const src = `https://stream.mux.com/${clip.mux_playback_id}.m3u8?max_resolution=720p`;
  import("hls.js").then(({ default: HlsCtor }) => {
    if (!card.wanted || card.hls || video.getAttribute("src")) return;
    if (HlsCtor.isSupported()) {
      card.hls = new HlsCtor({ startPosition: clip.start_time, maxBufferLength: 8 });
      card.hls.loadSource(src);
      card.hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }
  });
}

function detach(card: Card) {
  card.wanted = false;
  card.hls?.destroy();
  card.hls = null;
  card.video.removeAttribute("src");
  card.video.load();
  card.el.classList.remove("sd-has-frame");
}

// Wait (up to READY_TIMEOUT_MS) until the video can play from the line's start. Without it the first
// pass starts before the stream loads: the wall clock finishes the line and pauses the video before frame one.
function ready(card: Card): Promise<void> {
  const { clip, video } = card;
  const ok = () => video.readyState >= 3 && Math.abs(video.currentTime - clip.start_time) < 0.3;
  if (ok()) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const check = () => {
      if (!done && ok()) finish();
    };
    const seek = () => {
      try {
        video.currentTime = clip.start_time;
      } catch {
        /* not seekable yet */
      }
    };
    const finish = () => {
      done = true;
      video.removeEventListener("canplay", check);
      video.removeEventListener("seeked", check);
      video.removeEventListener("loadedmetadata", seek);
      resolve();
    };
    video.addEventListener("canplay", check);
    video.addEventListener("seeked", check);
    video.addEventListener("loadedmetadata", seek);
    seek();
    check();
    setTimeout(() => !done && finish(), READY_TIMEOUT_MS);
  });
}

// Play the line once. The clock follows the video while it's really playing, else wall time at
// PLAYBACK_RATE (stream slow, blocked, or poster-only).
async function run_line(card: Card, use_video: boolean, alive: () => boolean) {
  const { clip, video } = card;
  if (use_video) {
    await ready(card);
    if (!alive()) return;
    video.playbackRate = PLAYBACK_RATE;
    video.play().catch(() => {});
  }
  const t0 = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      if (!alive()) return resolve();
      const wall = clip.start_time + ((performance.now() - t0) / 1000) * PLAYBACK_RATE;
      const vt = use_video && !video.paused && video.readyState >= 2 && Math.abs(video.currentTime - wall) < 1.5 ? video.currentTime : wall;
      paint(card, vt);
      if (vt >= clip.end_time) {
        paint(card, clip.end_time);
        return resolve();
      }
      frame(tick);
    };
    frame(tick);
  });
  if (use_video) video.pause();
}

type Props = { tag: string; title: string; subtitle: string; clips: MarketingClip[]; ctaLabel: string; ctaHref?: string; tracking: string };

export default function ShadowDeck({ tag, title, subtitle, clips, ctaLabel, ctaHref, tracking }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const recRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const backdropRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Restricted in-app webviews force-fullscreen any playing <video>; there, only posters show.
  const [posterOnly, setPosterOnly] = useState(false);
  useEffect(() => setPosterOnly(isRestrictedInAppBrowser()), []);

  useEffect(() => {
    const section = sectionRef.current;
    const rec = recRef.current;
    if (!section || !rec || clips.length < 2) return;
    const cards: Card[] = clips.map((clip, i) => {
      const el = cardEls.current[i]!;
      return { clip, el, video: el.querySelector("video")!, lits: [...el.querySelectorAll<HTMLElement>(".sd-lit")], cover: el.querySelector<HTMLElement>(".sd-cover"), hls: null, wanted: false };
    });
    const n = cards.length;
    const use_video = !posterOnly;
    for (const c of cards) c.video.addEventListener("loadeddata", () => c.el.classList.add("sd-has-frame"));
    if (use_video) cards.slice(0, 2).forEach(attach);

    let idx = 0;
    let step = 0;
    let token = 0; // bumped to stop a running loop
    const loop = async (my: number) => {
      const alive = () => token === my;
      while (alive()) {
        const card = cards[idx];
        const prev = cards[(idx + n - 1) % n];
        const next = cards[(idx + 1) % n];
        const bd = backdropRefs.current[step % 2];
        if (bd) bd.style.backgroundImage = `url(${poster_url(card.clip)})`;
        bd?.classList.add("sd-on");
        backdropRefs.current[(step + 1) % 2]?.classList.remove("sd-on");
        barRef.current?.style.setProperty("--w", `${40 + (idx % 3) * 20}%`);

        // Deck: the front card leaves, the one behind moves up to the front, a fresh one grows in behind.
        paint(card, -1);
        if (prev !== card) {
          prev.el.classList.remove("sd-front", "sd-speak");
          prev.el.classList.add("sd-out");
        }
        card.el.classList.remove("sd-back", "sd-out");
        card.el.classList.add("sd-front");
        if (next !== prev) {
          next.el.classList.remove("sd-out");
          next.el.classList.add("sd-back");
          if (use_video) attach(next);
        }
        setTimeout(() => {
          prev.el.classList.remove("sd-out");
          if (next === prev) prev.el.classList.add("sd-back"); // a 2-card deck: the one that left comes back behind
          else if (use_video) detach(prev);
          if (use_video) {
            try {
              prev.video.currentTime = prev.clip.start_time; // back to frame one, never the line's last frame
            } catch {
              /* detached */
            }
          }
        }, MOVE_MS);
        await wait(MOVE_MS);
        if (!alive()) return;

        // The line plays once with "Speak now" up and the record button recording.
        card.el.classList.add("sd-speak");
        rec.classList.add("sd-rec-on");
        await run_line(card, use_video, alive);
        if (!alive()) return;
        await wait(STOP_AFTER_MS);
        rec.classList.remove("sd-rec-on");
        await wait(HOLD_MS);
        if (!alive()) return;
        idx = (idx + 1) % n;
        step++;
      }
    };

    // Only while the section is on screen, so the hero's video and this one never both stream.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          token++;
          loop(token);
        } else {
          token++;
          rec.classList.remove("sd-rec-on");
          for (const c of cards) c.video.pause();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(section);
    return () => {
      token++;
      io.disconnect();
      cards.forEach(detach);
    };
  }, [clips, posterOnly]);

  if (clips.length < 2) return null;

  return (
    <section ref={sectionRef} className="sd-sec">
      <div className="sd-copy">
        {/* Adam 11/17: a small tag naming the feature: accent text on a faint accent fill. */}
        <span className="sd-tag" style={{ ["--a" as string]: ACCENT }}>
          {/* Phosphor microphone (fill), same as the path's speak coin */}
          <svg viewBox="0 0 256 256" aria-hidden>
            <path d="M80,128V64a48,48,0,0,1,96,0v64a48,48,0,0,1-96,0Zm128,0a8,8,0,0,0-16,0,64,64,0,0,1-128,0,8,8,0,0,0-16,0,80.11,80.11,0,0,0,72,79.6V240a8,8,0,0,0,16,0V207.6A80.11,80.11,0,0,0,208,128Z" />
          </svg>
          {tag}
        </span>
        <h2>{title}</h2>
        <p className="sd-sub">{subtitle}</p>
        {/* Adam 11/17: a Try button here too, mint */}
        <DownloadCta label={ctaLabel} tracking={tracking} className="mt-6" href={ctaHref} />
      </div>
      <div className="sd-phone-wrap">
        <div className="sd-phone" role="img" aria-label={`${title}. ${subtitle}`}>
          <div className="sd-screen" style={SCREEN_STYLE}>
            <div ref={(el) => { backdropRefs.current[0] = el; }} className="sd-backdrop" />
            <div ref={(el) => { backdropRefs.current[1] = el; }} className="sd-backdrop" />
            <div className="sd-status">
              <span>9:41</span>
              <StatusIcons />
            </div>
            <div className="sd-bar"><i ref={barRef} /></div>
            <div className="sd-controls">
              <div className="sd-replay">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 12a8 8 0 1 0 2.6-5.9" />
                  <path d="M4 4v4.5h4.5" />
                </svg>
              </div>
              <div ref={recRef} className="sd-rec">
                <svg className="sd-mic" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V5.5a3.5 3.5 0 0 0-7 0V11a3.5 3.5 0 0 0 3.5 3.5z" />
                  <path d="M18.2 11a.9.9 0 0 0-1.8 0 4.4 4.4 0 0 1-8.8 0 .9.9 0 0 0-1.8 0 6.2 6.2 0 0 0 5.3 6.1V20H9a.9.9 0 0 0 0 1.8h6A.9.9 0 0 0 15 20h-2.1v-2.9a6.2 6.2 0 0 0 5.3-6.1z" />
                </svg>
                <span className="sd-sq" />
              </div>
            </div>
            <div className="sd-home" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/iphone-frame.png" alt="" draggable={false} className="sd-frame" />
          <div className="sd-cards">
            {clips.map((clip, i) => {
              const words = clip.word_level_captions ?? [];
              const hidden = hidden_index(words.length);
              return (
                <div
                  key={clip.caption_segment_id}
                  ref={(el) => { cardEls.current[i] = el; }}
                  className={`sd-card${i === 0 ? " sd-front" : i === 1 ? " sd-back" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="sd-poster"
                    src={poster_url(clip)}
                    alt=""
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      const pos = `${cover_position_x(clip.crop_center, img.naturalWidth / img.naturalHeight, CARD_ASPECT)} 50%`;
                      img.style.objectPosition = pos;
                      img.parentElement?.querySelector("video")?.style.setProperty("object-position", pos);
                    }}
                  />
                  <video muted playsInline preload="none" />
                  <div className="sd-scrim" />
                  <div className="sd-pill" style={{ backgroundColor: ACCENT }}>Speak now</div>
                  <div className="sd-cap">
                    <p className="sd-ko">
                      {words.map((w, k) => (
                        <span key={k}>
                          {k > 0 && " "}
                          <span className="sd-w">
                            <span className="sd-dim">{w.text}</span>
                            <span className="sd-lit" aria-hidden>{w.text}</span>
                            {k === hidden && <span className="sd-cover" />}
                          </span>
                        </span>
                      ))}
                    </p>
                    {clip.translation && <p className="sd-en">{clip.translation}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
