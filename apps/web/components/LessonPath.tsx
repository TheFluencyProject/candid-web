"use client";

import { useEffect, useMemo, useRef } from "react";
import DownloadCta from "@/components/DownloadCta";

// "Your path to conversational fluency" (mockup P1, Adam 11/11–11/17): the app's own lesson path (LessonHubPath:
// coins with a 3D lip on the wave, a sticker beside each indent, gray until earned) for three real lessons. The
// heading pins while the path scrolls up past it with the page, and a coin flips to its lesson's color the moment
// its centre passes a line a bit below mid-screen (a lesson's sticker colors in with its Play coin). Scrolling back up never un-lights one.
// No pulse, no labels, no transitions.

export type PathLesson = {
  tutor_name: string;
  avatar: string | null;
  // The lesson's own thumbnail, cover-fit into a square at `pos` (object-position).
  thumb: { url: string; pos: string } | null;
  title: string;
  accent: string;
  // The indent sticker: /landing/path-<id>-locked.webp (gray) and -accent.webp, w × h.
  sticker: { id: string; w: number; h: number };
};

type Kind = "watch" | "speak" | "vocab" | "listen" | "trophy";
// Adam 11/17: vary the speaking / vocab / listening order per lesson. Watch stays first (a lesson opens on its
// video), no lesson's order repeats, and no lesson's 2nd coin matches the one before it. 4 coins (Q6).
const ORDERS: Kind[][] = [
  ["watch", "speak", "vocab", "listen"],
  ["watch", "listen", "speak", "vocab"],
  ["watch", "vocab", "listen", "speak"],
];
// The app's wave at 4 circles per indent (LessonHubPath.wave).
const WAVE = [0, 40, 56, 40, 0, -40, -56, -40];
// Desktop geometry (the mockup's P1): wider swing at the indents (Adam 11/11), scaled to fit, at most 1.2×.
// A coin lights when its centre passes this far down the screen: a bit below the middle (Adam 11/17: "a tad" sooner).
const LIGHT_AT = 0.6;
const W = 440, ZIG = 86, COIN = 70, GAP = 28, BOX = 170, HEAD_H = 72, MAX_SCALE = 1.2;

// The app's section icons (LessonSectionType.rowIcon): Phosphor play / microphone / headphones (fill), and
// SF Symbols dumbbell.fill (Vocab) + trophy.fill (the final coin) as masks so they take the color.
function Icon({ kind }: { kind: Kind }) {
  if (kind === "vocab") return <i className="lp-db" />;
  if (kind === "trophy") return <i className="lp-tr" />;
  const d = {
    watch: "M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z",
    speak: "M80,128V64a48,48,0,0,1,96,0v64a48,48,0,0,1-96,0Zm128,0a8,8,0,0,0-16,0,64,64,0,0,1-128,0,8,8,0,0,0-16,0,80.11,80.11,0,0,0,72,79.6V240a8,8,0,0,0,16,0V207.6A80.11,80.11,0,0,0,208,128Z",
    listen: "M232,128v56a24,24,0,0,1-24,24H192a24,24,0,0,1-24-24V144a24,24,0,0,1,24-24h23.65a87.71,87.71,0,0,0-87-80H128a88,88,0,0,0-87.64,80H64a24,24,0,0,1,24,24v40a24,24,0,0,1-24,24H48a24,24,0,0,1-24-24V128A104.11,104.11,0,0,1,201.89,54.66,103.41,103.41,0,0,1,232,128Z",
  }[kind];
  return (
    <svg viewBox="0 0 256 256" aria-hidden>
      <path d={d} />
    </svg>
  );
}

// Lays the path out once: each lesson = a header row (tutor + title), then its coins on the wave (which runs on
// across lessons); the indent coin's sticker sits in the free space on the side its coin swung away from,
// leaning a few degrees toward the path. The last lesson ends on the trophy.
function layout(lessons: PathLesson[]) {
  const k = ZIG / 56, rowH = COIN + GAP;
  let y = 0, g = 0;
  const heads: { top: number; lesson: PathLesson }[] = [];
  const coins: { kind: Kind; left: number; top: number; accent: string }[] = [];
  // `first` = the lesson's Play coin: its sticker colors in with that one (Adam 11/17), not with its own indent coin.
  const stickers: { node: number; first: number; left: number; top: number; w: number; h: number; r: number; lesson: PathLesson }[] = [];
  const nodes: number[] = [];
  lessons.forEach((L, li) => {
    const first = g;
    heads.push({ top: y, lesson: L });
    y += HEAD_H;
    const order = ORDERS[li % ORDERS.length];
    const kinds: Kind[] = li === lessons.length - 1 ? [...order, "trophy"] : order;
    for (const kind of kinds) {
      const x = WAVE[g % 8] * k, cy = y + COIN / 2;
      coins.push({ kind, left: W / 2 + x, top: y, accent: L.accent });
      if (Math.abs(WAVE[g % 8]) === 56) {
        const side = x > 0 ? -1 : 1;
        const edge = W / 2 + x + side * (COIN / 2 + 14), cx = (edge + (side < 0 ? 0 : W)) / 2;
        const ar = L.sticker.w / L.sticker.h;
        stickers.push({ node: g, first, left: cx, top: cy, w: ar >= 1 ? BOX : BOX * ar, h: ar >= 1 ? BOX / ar : BOX, r: side < 0 ? 5 : -5, lesson: L });
      }
      nodes.push(cy);
      y += rowH;
      g++;
    }
    y += 10;
  });
  return { heads, coins, stickers, nodes, H: y };
}

type Props = { title: string; subtitle: string; ctaLabel: string; tracking: string; lessons: PathLesson[] };

export default function LessonPath({ title, subtitle, ctaLabel, tracking, lessons }: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
  const pvRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const P = useMemo(() => layout(lessons), [lessons]);
  const nodes = P.nodes;

  // Sizes only (never on scroll): the path scrolls natively, so it can't lag behind the page (Adam 11/17: "super
  // laggy"). Scale to the column; the heading's rail ends so it lets go just as the trophy reaches mid-screen.
  useEffect(() => {
    const grid = gridRef.current, copy = copyRef.current, pv = pvRef.current, track = trackRef.current;
    if (!grid || !copy || !pv || !track) return;
    const size = () => {
      const s = Math.min(MAX_SCALE, pv.clientWidth / W);
      track.style.transform = `translateX(${((pv.clientWidth - W * s) / 2).toFixed(1)}px) scale(${s})`;
      grid.style.setProperty("--lp-h", `${(P.H * s).toFixed(1)}px`);
      grid.style.setProperty("--lp-trophy", `${(track.offsetTop + nodes[nodes.length - 1] * s).toFixed(1)}px`);
      grid.style.setProperty("--lp-copy-h", `${copy.offsetHeight}px`);
    };
    const ro = new ResizeObserver(size);
    ro.observe(pv);
    ro.observe(copy);
    size();
    return () => ro.disconnect();
  }, [P, nodes]);

  // A coin lights once its centre passes the LIGHT_AT line: each coin's centre dot is watched against the screen
  // above that line. Lit = every coin up to the furthest one passed (scrolling back up never un-lights).
  useEffect(() => {
    const track = trackRef.current;
    const copy = copyRef.current;
    if (!track || !copy) return;
    const coins = [...track.querySelectorAll<HTMLElement>(".lp-pn")];
    const stks = [...track.querySelectorAll<HTMLElement>(".lp-pst")];
    let best = 0;
    // Which coins sit above the line right now. Lighting only ever grows (best), but the Try button follows where
    // you are: the color of the last coin above the line, going back up too (Adam 11/17: it stuck on the last
    // lesson's color). The first lesson's color before any.
    const above = coins.map(() => false);
    const tint = () => {
      const cur = above.lastIndexOf(true);
      copy.style.setProperty("--cta", coins[Math.max(0, cur)]?.style.getPropertyValue("--a") ?? "");
    };
    tint();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) above[Number((e.target as HTMLElement).dataset.i)] = e.boundingClientRect.top <= innerHeight * LIGHT_AT;
        tint();
        const next = Math.max(best, above.lastIndexOf(true) + 1);
        if (next === best) return;
        best = next;
        coins.forEach((c, i) => c.classList.toggle("lp-done", i < best));
        stks.forEach((st) => st.classList.toggle("lp-on", Number(st.dataset.first) < best));
      },
      { rootMargin: `0px 0px -${Math.round((1 - LIGHT_AT) * 100)}% 0px` },
    );
    track.querySelectorAll(".lp-mid").forEach((m) => io.observe(m));
    return () => io.disconnect();
  }, [nodes]);

  return (
    <section>
      <div ref={gridRef} className="lp-grid">
        <div className="lp-rail">
          <div ref={copyRef} className="lp-copy">
            <h2>{title}</h2>
            <p className="lp-sub">{subtitle}</p>
            <DownloadCta label={ctaLabel} tracking={tracking} className="mt-6" />
          </div>
        </div>
        <div ref={pvRef} className="lp-pv">
          <div ref={trackRef} className="lp-track" style={{ width: W, height: P.H }}>
            {P.heads.map(({ top, lesson }) => (
              <div key={`h${top}`} className="lp-sec" style={{ top, height: HEAD_H }}>
                {lesson.thumb ? (
                  <img className="lp-thumb" src={lesson.thumb.url} alt="" style={{ objectPosition: lesson.thumb.pos }} />
                ) : (
                  lesson.avatar && <img src={lesson.avatar} alt="" />
                )}
                <span>
                  <i>{lesson.tutor_name}</i>
                  {lesson.title}
                </span>
              </div>
            ))}
            {P.coins.map((c, i) => (
              <div key={`c${i}`} className="lp-pn" style={{ ["--a" as string]: c.accent, left: c.left, top: c.top }}>
                <div className="lp-face">
                  <span className="lp-g">
                    <Icon kind={c.kind} />
                  </span>
                </div>
                <i className="lp-mid" data-i={i} />
              </div>
            ))}
            {P.stickers.map((st) => (
              <div
                key={`s${st.node}`}
                className="lp-pst"
                data-first={st.first}
                style={{ ["--r" as string]: `${st.r}deg`, left: st.left, top: st.top, width: st.w, height: st.h }}
              >
                <img className="lp-gray" src={`/landing/path-${st.lesson.sticker.id}-locked.webp`} alt="" />
                <img className="lp-col" src={`/landing/path-${st.lesson.sticker.id}-accent.webp`} alt="" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
