"use client";

import { useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import { isRestrictedInAppBrowser } from "@/lib/platform";
import { ACCENT, SCREEN_STYLE, StatusIcons, spaced_title } from "@/components/PhoneClipHero";
import DownloadCta from "@/components/DownloadCta";

// Home "Learn Korean through / Comprehensible Input" (mockup tmp/tutor-roster-mockups/section-ci.html,
// plan plans/landing-ci-section-2026-11-17.md). One iPhone loops a Watch moment, a different real lesson
// line each time: the app's chips light up as they're said (the video's own clock), the tutor's key-term
// bubble floats over them, another word is tapped (no finger drawn) → the video pauses, the word peek
// opens, its bookmark fills, the peek morphs into the new front card of the white word deck over the
// phone's right edge, and the whole screen crossfades into the next clip. Geometry lives in globals.css
// (.ci-*), in iOS points (--pt = 1/393 of the screen's width).

export type InputPhoneClip = {
  title: string;
  mux_playback_id: string;
  start: number;
  end: number;
  avatar: string;
  bars: number[];
  chips: [string, number][];
  star: number;
  bubble: [string, string];
  peek: [number, string, string];
  translation: string;
};

// Four even beats after the tap, each 0.5 s long and 1 s apart: the peek opens (0), the bookmark
// fills (1), the peek turns into a card (2), the next clip crossfades in (3).
const BEAT = 1;
const DUR_MS = 500;
const SAVE_AT = BEAT;
const MORPH_AT = 2 * BEAT;
const NEXT_AT = 3 * BEAT;
const INTRO_S = 0.35; // black over the very first rewind only
const HOLD_S = 6; // a stream that never plays: a wall clock takes over after this long
const SHADES = ["#F7F7F6", "#E8E8E6", "#D9D9D7", "#CACAC8"];
const STAR =
  '<svg class="ci-star" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" fill="#89FFB4" d="M10 0a10 10 0 1 1 0 20a10 10 0 1 1 0-20ZM10 4.2l1.75 3.55 3.9.57-2.83 2.76.67 3.9L10 13.14l-3.49 1.84.67-3.9L4.35 8.32l3.9-.57Z"/></svg>';

const poster_url = (c: InputPhoneClip) => `https://image.mux.com/${c.mux_playback_id}/thumbnail.jpg?time=${c.start}&width=800`;

type Props = {
  tag: string;
  title: string;
  subtitle: string;
  seeMore: string;
  clips: InputPhoneClip[];
  seed: [string, string]; // the deck's front card before anything is saved
  ctaLabel: string;
  ctaHref?: string;
  tracking: string;
};

export default function InputPhone({ tag, title, subtitle, seeMore, clips, seed, ctaLabel, ctaHref, tracking }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  // Restricted in-app webviews force-fullscreen any playing <video>; there, only posters show.
  const [posterOnly, setPosterOnly] = useState(false);
  useEffect(() => setPosterOnly(isRestrictedInAppBrowser()), []);

  useEffect(() => {
    const section = sectionRef.current;
    const screen = screenRef.current;
    const pop = popRef.current;
    if (!section || !screen || !pop || clips.length === 0) return;
    const q = <T extends Element>(root: Element, sel: string) => root.querySelector(sel) as T;
    const vids = [...screen.querySelectorAll<HTMLVideoElement>(".ci-vid")];
    const dim = q<HTMLDivElement>(screen, ".ci-dim");
    const black = q<HTMLDivElement>(screen, ".ci-black");
    const titleRow = q<HTMLDivElement>(screen, ".ci-title");
    const titleEl = q<HTMLSpanElement>(screen, ".ci-name");
    const barsEl = q<HTMLDivElement>(screen, ".ci-bars");
    const lineEl = q<HTMLDivElement>(screen, ".ci-line");
    const cap = q<HTMLDivElement>(screen, ".ci-cap");
    const tr = q<HTMLDivElement>(screen, ".ci-tr");
    const ghostsScreen = q<HTMLDivElement>(screen, ".ci-ghosts");
    const deckEl = q<HTMLDivElement>(pop, ".ci-deck");
    const tutor = q<HTMLDivElement>(pop, ".ci-tutor");
    const av = q<HTMLImageElement>(pop, ".ci-av");
    const bw = q<HTMLElement>(pop, ".ci-bw");
    const bg = q<HTMLElement>(pop, ".ci-bg");
    const peek = q<HTMLDivElement>(pop, ".ci-peek");
    const pw = q<HTMLElement>(pop, ".ci-pw");
    const pg = q<HTMLElement>(pop, ".ci-pg");
    const ghostsPop = q<HTMLDivElement>(pop, ".ci-ghosts");
    const use_video = !posterOnly;
    const n = clips.length;

    // At most two streams: the clip on screen and the next one, parked on its line's start.
    const hls: (Hls | null)[] = clips.map(() => null);
    const wanted = clips.map(() => false);
    const attach = (i: number) => {
      wanted[i] = true;
      const v = vids[i];
      if (!use_video || hls[i] || v.getAttribute("src")) return;
      v.muted = true; // iOS: set imperatively, the prop doesn't reliably reach the element
      const c = clips[i];
      const src = `https://stream.mux.com/${c.mux_playback_id}.m3u8?max_resolution=720p`;
      import("hls.js").then(({ default: HlsCtor }) => {
        if (!wanted[i] || hls[i] || v.getAttribute("src")) return;
        if (HlsCtor.isSupported()) {
          const h = new HlsCtor({ startPosition: c.start, maxBufferLength: 8 });
          h.loadSource(src);
          h.attachMedia(v);
          hls[i] = h;
        } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
          v.src = src;
          v.addEventListener("loadedmetadata", () => park(i), { once: true });
        }
      });
    };
    const detach = (i: number) => {
      wanted[i] = false;
      hls[i]?.destroy();
      hls[i] = null;
      if (vids[i].getAttribute("src")) {
        vids[i].removeAttribute("src");
        vids[i].load();
      }
    };
    const park = (i: number) => {
      try {
        vids[i].currentTime = clips[i].start;
      } catch {
        /* not seekable yet */
      }
    };

    // Layout, in the pop layer's px (it has the screen's box, so in-screen positions carry over).
    let idx = -1;
    let clip = clips[0];
    let vid = vids[0];
    let chips: HTMLSpanElement[] = [];
    let tapV = 0;
    const rel = (r: DOMRect, p: DOMRect) => ({ l: r.left - p.left, t: r.top - p.top, w: r.width });
    const measure = () => {
      if (!chips.length) return; // fonts.ready / resize can land before the first clip's chips exist
      const p = pop.getBoundingClientRect();
      const pt = p.width / 393;
      const c = rel(cap.getBoundingClientRect(), p);
      const word = rel(chips[clip.peek[0]].getBoundingClientRect(), p);
      const x = word.l + word.w / 2;
      // Bubble: avatar 23pt in, its bottom 17pt above the chips' top.
      tutor.style.left = `${23 * pt}px`;
      tutor.style.bottom = `${p.height - c.t + 17 * pt}px`;
      // Peek: tail over the chip, kept on screen like the app; it grows from the tail.
      const width = 252 * pt;
      const left = Math.max(10 * pt, Math.min(x - 40 * pt, p.width - 10 * pt - width));
      peek.style.left = `${left}px`;
      peek.style.bottom = `${p.height - word.t + 8 * pt}px`;
      peek.style.setProperty("--tail", `${x - left - 7 * pt}px`);
      peek.style.transformOrigin = `${x - left}px 100%`;
    };

    // Put clip i on screen: its video, title, bars, chips, translation, bubble, peek.
    const load = (i: number, xfade: boolean) => {
      const prev = idx >= 0 ? vid : null;
      idx = i;
      clip = clips[i];
      vid = vids[i];
      attach(i);
      if (xfade && prev && prev !== vid) {
        vids.forEach((v) => v.classList.remove("ci-top"));
        vid.classList.add("ci-top");
        setTimeout(() => vid.classList.add("ci-on"), 20);
        setTimeout(() => {
          prev.classList.remove("ci-on");
          prev.pause();
        }, DUR_MS + 60);
      } else {
        vids.forEach((v, k) => {
          v.classList.toggle("ci-on", k === i);
          v.classList.toggle("ci-top", k === i);
          if (k !== i) v.pause();
        });
        vid.pause();
        park(i);
      }
      // Preload the next clip; let go of the rest once the crossfade is over.
      const ni = (i + 1) % n;
      attach(ni);
      park(ni);
      later(() => clips.forEach((_, k) => k !== idx && k !== (idx + 1) % n && detach(k)), DUR_MS + 200);

      titleEl.textContent = spaced_title(clip.title);
      barsEl.replaceChildren(
        ...clip.bars.map((f) => {
          const bar = document.createElement("i");
          const fill = document.createElement("b");
          fill.style.width = `${f * 100}%`;
          bar.appendChild(fill);
          return bar;
        })
      );
      chips = clip.chips.map(([text], k) => {
        const el = document.createElement("span");
        el.className = "ci-w";
        el.textContent = text;
        if (k === clip.star) el.insertAdjacentHTML("beforeend", STAR);
        return el;
      });
      cap.replaceChildren(...chips);
      tr.textContent = clip.translation;
      av.src = clip.avatar;
      bw.textContent = clip.bubble[0];
      bg.textContent = clip.bubble[1];
      pw.textContent = clip.peek[1];
      pg.textContent = clip.peek[2];
      // The peeked chip is tapped while it's being said: 0.3 s in, before the next chip starts.
      const s0 = clip.chips[clip.peek[0]][1];
      const next = clip.chips[clip.peek[0] + 1];
      tapV = Math.min(s0 + 0.3, next ? next[1] - 0.04 : clip.end);
      peek.classList.remove("ci-show", "ci-saved");
      measure();
    };

    // The saved-words deck (the onboarding Vocab screen's): front card = the latest word, centred;
    // blank cards behind, each a shade darker, turned 5° more and stepped up-right evenly.
    let cards: HTMLDivElement[] = [];
    const cardEl = (k: string, g: string) => {
      const e = document.createElement("div");
      e.className = "ci-card";
      const kd = document.createElement("div");
      kd.className = "ci-k";
      kd.textContent = k;
      const gd = document.createElement("div");
      gd.className = "ci-g";
      gd.textContent = g;
      e.append(kd, gd);
      return e;
    };
    const lay = () => {
      const pt = pop.getBoundingClientRect().width / 393;
      cards.forEach((e, i) => {
        e.style.zIndex = String(10 - i);
        e.style.transform = `translate(${i * 9 * pt}px, ${-i * 8 * pt}px) rotate(${i * 5}deg)`;
        e.style.background = SHADES[Math.min(i, 3)];
        e.style.opacity = i > 3 ? "0" : "1";
        e.classList.toggle("ci-back", i > 0);
      });
    };
    const push = (k: string, g: string) => {
      const e = cardEl(k, g);
      deckEl.appendChild(e);
      cards.unshift(e);
      lay();
      while (cards.length > 5) cards.pop()!.remove();
      return e;
    };
    // The peek itself morphs into the new front card while the old one steps back.
    const morphTo = (k: string, g: string) => {
      const p = pop.getBoundingClientRect();
      const r = peek.getBoundingClientRect();
      const d = deckEl.getBoundingClientRect();
      const pt = p.width / 393;
      const m = document.createElement("div");
      m.className = "ci-morph";
      const inner = cardEl(k, g);
      inner.classList.add("ci-morph-in");
      m.appendChild(inner);
      pop.appendChild(m);
      const box = (b: DOMRect, rad: number) => ({ left: `${b.left - p.left}px`, top: `${b.top - p.top}px`, width: `${b.width}px`, height: `${b.height}px`, borderRadius: `${rad * pt}px` });
      const timing: KeyframeAnimationOptions = { duration: DUR_MS, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" };
      m.animate([box(r, 15), box(d, 24)], timing);
      inner.animate([{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }], timing);
      peek.classList.add("ci-fresh");
      const e = push(k, g);
      e.style.visibility = "hidden";
      setTimeout(() => {
        e.style.visibility = "";
        m.remove();
      }, DUR_MS + 30);
    };
    deckEl.replaceChildren();
    push("", "");
    push("", "");
    push(seed[0], seed[1]);

    // One loop: "intro" (black, first clip only) → "play" (the video's clock drives the chips) →
    // "peek" (wall clock) → the next clip.
    type Phase = "intro" | "play" | "peek";
    let phase: Phase = "intro";
    let phaseAt = 0;
    let videoStarted = false;
    let wallClock = false;
    let morphed = false;
    let first = true;
    let running = false;
    let pausedAt = 0;
    let lastFrame = 0;
    let raf = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const ghostOf = (el: Element) => el.cloneNode(true);
    const play = () => {
      if (!use_video) return;
      vid.playbackRate = 1;
      vid.play().catch(() => {});
    };
    const begin = () => {
      videoStarted = false;
      wallClock = false;
      morphed = false;
      if (first) {
        first = false;
        phase = "intro";
        phaseAt = performance.now();
        load(0, false);
        return;
      }
      // Copy the outgoing screen's overlays into ghosts that fade out while the next clip, already
      // playing, fades in with its own line: one crossfade, no black between clips.
      const gS = document.createElement("div");
      gS.className = "ci-ghost";
      gS.append(ghostOf(dim), ghostOf(titleRow), ghostOf(lineEl));
      ghostsScreen.appendChild(gS);
      const gP = document.createElement("div");
      gP.className = "ci-ghost";
      gP.append(ghostOf(peek));
      ghostsPop.appendChild(gP);
      const fresh = [dim, peek, tutor, titleRow, lineEl];
      fresh.forEach((e) => e.classList.add("ci-fresh"));
      load((idx + 1) % n, true);
      dim.style.opacity = "0";
      phase = "play";
      phaseAt = performance.now();
      play();
      later(() => {
        gS.style.opacity = "0";
        gP.style.opacity = "0";
        fresh.forEach((e) => e.classList.remove("ci-fresh"));
      }, 20);
      later(() => {
        gS.remove();
        gP.remove();
      }, DUR_MS + 100);
    };

    const frame = () => {
      if (!running) return;
      const now = performance.now();
      lastFrame = now;
      let s = (now - phaseAt) / 1000;
      let v = clip.start;
      if (phase === "intro" && s >= INTRO_S) {
        phase = "play";
        phaseAt += INTRO_S * 1000;
        s -= INTRO_S;
        play();
      }
      if (phase === "play") {
        // The video's own clock once its picture is really moving (so the chips match the lips). While it
        // buffers nothing is lit; only if it never plays (or posters only) does a wall clock take over.
        const hold = use_video ? HOLD_S : 0;
        if (use_video && !videoStarted && !wallClock && !vid.paused && vid.currentTime > clip.start + 0.02) videoStarted = true;
        // Once the wall clock has taken over, it keeps the line: a stream that starts late would light the
        // chips from the top again. Its frame holds still instead.
        if (!videoStarted && !wallClock && s > hold) {
          wallClock = true;
          vid.pause();
        }
        v = videoStarted ? vid.currentTime : clip.start - 0.01 + Math.max(0, s - hold);
        if (v >= tapV) {
          // Start the peek clock where the line crossed the tap.
          const cross = videoStarted ? s : hold + (tapV - clip.start + 0.01);
          phase = "peek";
          phaseAt += Math.min(s, cross) * 1000;
          s = (now - phaseAt) / 1000;
          vid.pause();
        }
      }
      if (phase === "peek") {
        v = tapV;
        if (s >= NEXT_AT) {
          begin();
          return;
        }
      }
      black.style.opacity = phase === "intro" ? "1" : "0";
      // The chip being said = the last chip that has started (gaps keep the previous one lit, as in the app).
      const lit = phase === "intro" ? -1 : clip.chips.reduce((k, [, cs], i) => (v >= cs ? i : k), -1);
      chips.forEach((el, i) => el.classList.toggle("ci-lit", i === lit));
      const peekUp = phase === "peek";
      // The key-term bubble is up for the whole line; the app hides it under a peek.
      tutor.classList.toggle("ci-show", phase === "play" && s > 0.25);
      dim.style.opacity = peekUp ? "0.35" : "0";
      peek.classList.toggle("ci-show", peekUp);
      peek.classList.toggle("ci-saved", peekUp && s >= SAVE_AT);
      if (peekUp && s >= MORPH_AT && !morphed) {
        morphed = true;
        morphTo(clip.peek[1], clip.peek[2]);
      }
    };
    const tick = () => {
      frame();
      if (running) raf = requestAnimationFrame(tick);
    };
    // A throttled rAF (background tab) still moves the clock.
    const nudge = setInterval(() => {
      if (running && performance.now() - lastFrame > 150) frame();
    }, 60);

    const start = () => {
      if (running) return;
      running = true;
      if (first) begin();
      else {
        phaseAt += performance.now() - pausedAt; // hold the beat while off screen
        if (phase === "play" && !wallClock) play();
      }
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      pausedAt = performance.now();
      cancelAnimationFrame(raf);
      vids.forEach((v) => v.pause());
    };

    // Only while the section is on screen, so the hero's video and this one never both stream.
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.25 });
    io.observe(section);
    const onResize = () => {
      measure();
      lay();
    };
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => measure());
    return () => {
      stop();
      io.disconnect();
      clearInterval(nudge);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", onResize);
      clips.forEach((_, k) => detach(k));
      ghostsScreen.replaceChildren();
      ghostsPop.replaceChildren();
      pop.querySelectorAll(".ci-morph").forEach((m) => m.remove());
    };
  }, [clips, seed, posterOnly]);

  if (clips.length === 0) return null;

  return (
    <section ref={sectionRef} className="ci-sec">
      <div className="ci-grid">
        <div className="ci-copy">
          {/* Adam 11/17: the term becomes a tag like Shadowing's; the title says what you get */}
          <span className="sd-tag" style={{ ["--a" as string]: ACCENT }}>
            {/* Phosphor headphones (fill), same as the path's listen coin */}
            <svg viewBox="0 0 256 256" aria-hidden>
              <path d="M232,128v56a24,24,0,0,1-24,24H192a24,24,0,0,1-24-24V144a24,24,0,0,1,24-24h23.65a87.71,87.71,0,0,0-87-80H128a88,88,0,0,0-87.64,80H64a24,24,0,0,1,24,24v40a24,24,0,0,1-24,24H48a24,24,0,0,1-24-24V128A104.11,104.11,0,0,1,201.89,54.66,103.41,103.41,0,0,1,232,128Z" />
            </svg>
            {tag}
          </span>
          <h2>{title}</h2>
          <p className="ci-sub">{subtitle}</p>
          {/* Adam 11/17: a Try button here too, mint */}
          <DownloadCta label={ctaLabel} tracking={tracking} className="mt-6" href={ctaHref} />
        </div>
        <div className="ci-right">
          <div className="ci-phone" role="img" aria-label={`${tag}: ${title}. ${subtitle}`}>
            <div ref={screenRef} className="ci-screen" style={SCREEN_STYLE}>
              <div className="ci-vids">
                {clips.map((c) => (
                  <video key={c.mux_playback_id} className="ci-vid" muted playsInline preload="none" poster={poster_url(c)} />
                ))}
              </div>
              <div className="ci-scrim-top" />
              <div className="ci-scrim-cap" />
              <div className="ci-dim" />
              <div className="ci-status">
                <span>9:41</span>
                <StatusIcons />
              </div>
              <div className="ci-title">
                <div className="ci-row">
                  <span className="ci-name" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/switch.2.svg" alt="" className="ci-switch" />
                </div>
                <div className="ci-bars" />
              </div>
              <div className="ci-line">
                <div className="ci-cap" />
                <div className="ci-tr" />
              </div>
              <div className="ci-ghosts" />
              <div className="ci-home" />
              <div className="ci-black" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/iphone-frame.png" alt="" draggable={false} className="ci-frame" />
            <div ref={popRef} className="ci-pop">
              <div className="ci-deck" />
              <div className="ci-tutor">
                <div className="ci-bub">
                  <div>
                    <b className="ci-bw" />
                    <span className="ci-bg" />
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="ci-av" src={clips[0].avatar} alt="" />
              </div>
              <div className="ci-peek">
                <div className="ci-prow">
                  <span className="ci-pw" />
                  <span className="ci-pg" />
                  <span className="ci-bm">
                    <svg className="ci-bm-empty" viewBox="0 0 15 18" aria-hidden>
                      <path d="M2 1.8h11v14.4l-5.5-3.8L2 16.2Z" fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="1.6" strokeLinejoin="round" />
                    </svg>
                    <svg className="ci-bm-fill" viewBox="0 0 15 18" aria-hidden>
                      <path d="M2 1.8h11v14.4l-5.5-3.8L2 16.2Z" fill="#22A05A" stroke="#22A05A" strokeWidth="1.6" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <div className="ci-more">{seeMore}</div>
              </div>
              <div className="ci-ghosts" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
