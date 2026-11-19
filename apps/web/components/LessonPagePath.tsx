"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, type Kind } from "@/components/LessonPath";
import type { LessonPathData, LessonPathNodeKind } from "@/lib/api";
import { alignLessonPath } from "@/lib/lesson-path-align";

// The lesson share page's path arm (lesson-page-hero = path; plan lesson-page-path-2026-11-18): the lesson's whole
// in-app path, one block per mini lesson ("PART n" over its title), its coins in the app's order on the app's wave,
// its sticker beside them, Dialogue + Unit Review at the end. Unlike home's path nothing colors in on scroll: only
// coin 1 is lit (with the app's pulse), every other coin and every sticker stays locked gray, so the visitor has to
// press Study to fill it in (Adam 11/18). Every coin presses like the app's and opens the app's bubble on release.
// Phones also get the floating Study card (the lesson's row over the button) once the hero's button has scrolled away.

// Raw message templates (messages/*.json lesson_path, copied from the app's Localizable.xcstrings); {count} filled here.
export type LessonPathCopy = {
  part: string;
  watch: string;
  shadowing: string;
  expressions: string;
  vocab_practice: string;
  words: string;
  listening_quiz: string;
  no_captions: string;
  dialogue: string;
  unit_review: string;
};

type Props = {
  path: LessonPathData;
  accent: string;
  copy: LessonPathCopy;
  ctaLabel: string;
  ctaHref: string;
  // The hero's left column (desktop: the path's first part starts on its top line) and its Study button (phones: the
  // card shows once it has scrolled under the top bar).
  heroId: string;
  heroCtaId: string;
  // The phone card's row (Adam 11/18, phone 6): thumbnail, lesson title, tutor.
  lesson: { title: string; tutor: string; thumbUrl: string | null; thumbPos: string };
};

type RowKind = LessonPathNodeKind | "dialogue" | "trophy";
type Row = { g: number; kind: RowKind; goal?: number };
type Sticker = { url: string; left: number; top: number; w: number; h: number; r: number; row: number };
type Part = { title: string | null; seconds: number; rows: Row[]; xs: number[]; sticker: Sticker | null };

// Home's path geometry (LessonPath), stickers 10 % under home's 170 (Adam 11/18).
const W = 440, ZIG = 86, COIN = 70, BOX = 153;
const PITCH = 98; // row 70 + gap 28
const GAP = 24; // clear space kept between a sticker and any coin, both ways
const BUBBLE_W = 300;
// Desktop = lg, the page's (and DownloadQRInterceptor's) breakpoint.
const DESKTOP_MIN_PX = 1024;

// The app's wave (LessonHubPath.wave): a full swing on one row every n rows, sides alternating, the rows between on
// a straight line, so every row steps the same 2 × ZIG / n (Adam 11/19: a cosine's step across the centre was twice
// the others'). g runs on across every part, as in the app.
const waveX = (g: number, n: number) => {
  const p = (((g - Math.floor(n / 2)) % (2 * n)) + 2 * n) % (2 * n); // rows past the right indent
  return ZIG * (1 - (2 * Math.min(p, 2 * n - p)) / n);
};

const fill = (template: string, n: number) => template.replace("{count}", String(n));

// A part's sticker goes in the middle of the open space beside its own coins (Adam 11/18): on each side, the band
// where it clears every coin by GAP and stays between the part's first and last coin, centred in that band. The side
// with the taller band wins (then the roomier one). Shrinks to 90/80/70 % only if nothing fits.
function placeSticker(st: { url: string; width: number; height: number }, xs: number[]): Sticker | null {
  const m = xs.length, ar = st.width / st.height;
  if (!m || !(ar > 0)) return null;
  const w0 = ar >= 1 ? BOX : BOX * ar, h0 = ar >= 1 ? BOX / ar : BOX;
  const top = -41, bottom = (m - 1) * PITCH + 41; // the part's coin span (disc + lip); row 0's centre = 0
  for (const s of [1, 0.9, 0.8, 0.7]) {
    const w = w0 * s, h = h0 * s;
    let best: { span: number; room: number; side: number; y: number; bound: number } | null = null;
    for (const side of [-1, 1]) {
      // Room on this side for a sticker centred at y: the nearest coin edge it shares a height band with.
      const at = (y: number) => {
        const near = xs.map((x, k) => ({ x, c: k * PITCH })).filter(({ c }) => c + 41 + GAP > y - h / 2 && c - 41 - GAP < y + h / 2);
        const bound = side < 0
          ? Math.min(W, ...near.map(({ x }) => W / 2 + x - COIN / 2 - GAP))
          : Math.max(0, ...near.map(({ x }) => W / 2 + x + COIN / 2 + GAP));
        return { bound, room: side < 0 ? bound : W - bound };
      };
      // Walk the centres 2 px apart; keep the longest run where it fits.
      let run: { a: number; b: number } | null = null, longest: { a: number; b: number } | null = null;
      for (let y = top + h / 2; y <= bottom - h / 2 + 0.01; y += 2) {
        if (at(y).room >= w) {
          run = run ? { a: run.a, b: y } : { a: y, b: y };
          if (!longest || run.b - run.a > longest.b - longest.a) longest = { ...run };
        } else run = null;
      }
      if (!longest) continue;
      const y = (longest.a + longest.b) / 2, { bound, room } = at(y);
      const cand = { span: longest.b - longest.a, room, side, y, bound };
      if (!best || cand.span > best.span + 1 || (Math.abs(cand.span - best.span) <= 1 && cand.room > best.room)) best = cand;
    }
    if (best) {
      const row = Math.max(0, Math.min(m - 1, Math.floor(best.y / PITCH)));
      const left = best.side < 0 ? best.bound / 2 : (best.bound + W) / 2;
      return { url: st.url, left, top: COIN / 2 + best.y - row * PITCH, w, h, r: best.side < 0 ? 5 : -5, row };
    }
  }
  return null;
}

// One block per mini lesson; the Dialogue / trophy tail joins the last one (as in the app's hub).
function layout(path: LessonPathData): Part[] {
  const n = path.hub_nodes_per_indent || 3;
  let g = 0;
  const parts = path.units.map((u) => ({
    title: u.title,
    seconds: u.watch_seconds,
    sticker: u.sticker,
    rows: u.nodes.map((node): Row => ({ g: g++, kind: node.kind, goal: node.goal })),
  }));
  const last = parts[parts.length - 1];
  if (path.tail.dialogue) last.rows.push({ g: g++, kind: "dialogue" });
  if (path.tail.review) last.rows.push({ g: g++, kind: "trophy" });
  return parts.map((p) => {
    const xs = p.rows.map((r) => waveX(r.g, n));
    return { title: p.title, seconds: p.seconds, rows: p.rows, xs, sticker: p.sticker ? placeSticker(p.sticker, xs) : null };
  });
}

// The app's node bubble (ChapterRowBubble) copy: header, then the line under it.
function bubbleCopy(row: Row, part: Part, copy: LessonPathCopy): { head: string; sub: React.ReactNode } {
  switch (row.kind) {
    case "watch": {
      const s = Math.round(part.seconds);
      // No title in the visitor's language: the app's own fallback header, "Watch".
      return {
        head: part.title ?? copy.watch,
        sub: s > 0 ? <><i className="lpp-pl" />{`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}</> : null,
      };
    }
    // The server's Speak goal (unit_shadow_goals, capped at the unit's lines like the app's pool), never the raw line count.
    case "speak": return { head: copy.shadowing, sub: row.goal ? fill(copy.expressions, row.goal) : null };
    // The app's count is per learner; the web always says 5 (Adam 11/18).
    case "vocab": return { head: copy.vocab_practice, sub: fill(copy.words, 5) };
    case "quiz": return { head: copy.listening_quiz, sub: copy.no_captions };
    case "dialogue": return { head: copy.dialogue, sub: null };
    case "trophy": return { head: copy.unit_review, sub: null };
  }
}

// The app's icons (LessonHubPath.icon): its quiz coin wears the headphones (.listen).
const iconKind = (kind: RowKind): Kind => (kind === "quiz" ? "listen" : kind);

export default function LessonPagePath({ path, accent, copy, ctaLabel, ctaHref, heroId, heroCtaId, lesson }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const parts = useMemo(() => layout(path), [path]);
  // g of the coin holding the bubble / the coin being pressed.
  const [open, setOpen] = useState<number | null>(null);
  const [down, setDown] = useState<number | null>(null);
  const [barOn, setBarOn] = useState(false);

  // Phones: scale the 440-wide path to its column (desktop's 1.15 is CSS). Before hydration it's clipped, not
  // scrolled sideways (.lpp's overflow-x), and it sits below the hero there anyway.
  useEffect(() => {
    const root = rootRef.current, el = pathRef.current;
    if (!root || !el) return;
    const size = () => { el.style.zoom = innerWidth >= DESKTOP_MIN_PX ? "" : String(Math.min(1, root.clientWidth / W)); };
    const ro = new ResizeObserver(size);
    ro.observe(root);
    size();
    return () => ro.disconnect();
  }, []);

  // Desktop: keep the first part on the left column's top line as the window or the title's lines change (the page's
  // inline script placed it before first paint).
  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) return;
    const ro = new ResizeObserver(() => alignLessonPath(heroId));
    ro.observe(hero);
    for (const child of hero.children) ro.observe(child);
    return () => ro.disconnect();
  }, [heroId]);

  // An outside tap or a scroll closes the bubble; a tap's few px of jitter don't (the app drops it on a drag).
  useEffect(() => {
    if (open == null) return;
    const y0 = scrollY;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.(".lpp-coin, .lpp-bub")) setOpen(null);
    };
    const onScroll = () => { if (Math.abs(scrollY - y0) > 8) setOpen(null); };
    document.addEventListener("pointerdown", onDown);
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      removeEventListener("scroll", onScroll);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);
  // desktop-qr-card's card arm: a Study press brings up the corner QR card, which takes over from the open bubble.
  useEffect(() => {
    const close = () => setOpen(null);
    window.addEventListener("candid:qr-card", close);
    return () => window.removeEventListener("candid:qr-card", close);
  }, []);

  // Phones: the Study card slides up once the hero's button has gone under the top bar (61px), and back down above it.
  useEffect(() => {
    const hero = document.getElementById(heroCtaId);
    if (!hero) return;
    const io = new IntersectionObserver(
      ([e]) => setBarOn(!e.isIntersecting && e.boundingClientRect.top < 61),
      { rootMargin: "-61px 0px 0px 0px" },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [heroCtaId]);

  // Click, not pointerup, so a keyboard Enter opens it too. The press's spring back (90 ms) finishes first.
  const tap = (g: number) => {
    clearTimeout(timer.current);
    if (open === g) { setOpen(null); return; }
    setOpen(null);
    timer.current = window.setTimeout(() => setOpen(g), 90);
  };

  return (
    // suppressHydrationWarning: the page's pre-paint script has already set --lpp-top on this style (lib/lesson-path-align).
    <div ref={rootRef} className="lpp" style={{ ["--a" as string]: accent }} suppressHydrationWarning>
      <div ref={pathRef} className="lpp-path">
        {parts.map((p, pi) => (
          <div key={pi} className="lpp-part">
            <div className={`lpp-ph${p.title ? "" : " lpp-bare"}`}>
              <b>{fill(copy.part, pi + 1)}</b>
              {p.title && <span>{p.title}</span>}
            </div>
            {p.rows.map((r, k) => {
              const cx = W / 2 + p.xs[k];
              const isOpen = open === r.g;
              const { head, sub } = bubbleCopy(r, p, copy);
              const left = Math.max(0, Math.min(W - BUBBLE_W, cx - BUBBLE_W / 2));
              return (
                <div key={r.g} className={`lpp-row${isOpen ? " lpp-open" : ""}`}>
                  {p.sticker?.row === k && (
                    <div
                      className="lpp-stk"
                      style={{ ["--r" as string]: `${p.sticker.r}deg`, left: p.sticker.left, top: p.sticker.top, width: p.sticker.w, height: p.sticker.h }}
                    >
                      {/* Plain <img> straight from CloudFront, like the page's other remote images. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.sticker.url} alt="" loading="lazy" />
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={head}
                    aria-expanded={isOpen}
                    className={`lp-pn lpp-coin${r.g === 0 ? " lpp-cur" : ""}${r.g === 0 || isOpen ? " lp-done" : ""}${down === r.g ? " lpp-down" : ""}`}
                    style={{ left: cx }}
                    onPointerDown={() => setDown(r.g)}
                    onPointerUp={() => setDown(null)}
                    onPointerLeave={() => setDown(null)}
                    onPointerCancel={() => setDown(null)}
                    onClick={() => tap(r.g)}
                  >
                    <span className="lp-face">
                      <span className="lp-g">
                        <Icon kind={iconKind(r.kind)} />
                      </span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="lpp-bub" style={{ left, ["--ax" as string]: `${cx - left}px` }}>
                      <b>{head}</b>
                      {sub && <span>{sub}</span>}
                      {/* A /download link like every Study button: DownloadQRInterceptor tracks it and pops the QR on desktop. */}
                      <a href={ctaHref} className="cta-3d" style={{ ["--cta" as string]: accent }}>
                        {ctaLabel}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className={`lpp-bar${barOn ? "" : " lpp-hide"}`} aria-hidden={!barOn}>
        <div className="lpp-bar-row">
          {lesson.thumbUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lesson.thumbUrl} alt="" style={{ objectPosition: lesson.thumbPos }} />
          )}
          <div>
            <b>{lesson.title}</b>
            <span>{lesson.tutor}</span>
          </div>
        </div>
        <a href={ctaHref} className="cta-3d" style={{ ["--cta" as string]: accent }} tabIndex={barOn ? undefined : -1}>
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
