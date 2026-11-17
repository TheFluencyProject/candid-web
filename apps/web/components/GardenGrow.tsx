"use client";

import { useEffect, useRef } from "react";
import { garden_bed } from "@/lib/garden-art";
import { on_scroll_frame, pin_progress } from "@/lib/pin-scroll";

// "Watch your Korean grow" (mockup G1, Adam 11/11–11/17): the onboarding garden bed (the app's own plant art)
// under a night sky. The section pins and the scroll grows it in three equal stretches with a pause after each:
// 1 plant, pause, up to 7, pause, up to 30, a longer pause before the page moves on. Continuous throughout;
// scrolling back up keeps what's grown.
const G = 30, GROW = 1, PAUSE = 0.6, END_PAUSE = 1.2;
const LEGS = [[0, 1], [1, 7], [7, 30]];
const SPAN = LEGS.length * GROW + (LEGS.length - 1) * PAUSE + END_PAUSE; // in scroll units
const cl = (v: number) => Math.max(0, Math.min(1, v));
const eo = (t: number) => 1 - Math.pow(1 - cl(t), 3);
const back = (v: number) => {
  v = cl(v);
  const a = 1.9, b = a + 1;
  return 1 + b * Math.pow(v - 1, 3) + a * Math.pow(v - 1, 2);
};
// plants grown so far (a float: plant k grows, with its patch, from k to k + 1) at scroll unit u
const plants_at = (u: number) => {
  const i = Math.min(LEGS.length - 1, Math.floor(u / (GROW + PAUSE))), [a, b] = LEGS[i];
  return a + (b - a) * Math.min(1, (u - i * (GROW + PAUSE)) / GROW);
};
const growth = (k: number, c: number) => back(c - k);
// Day 1's patch is there from the start, empty; every later patch comes in with its own plant.
const tileA = (k: number, c: number) => (k === 0 ? 1 : eo((c - k) / 0.35));

// The app's GardenSky night (#131A3A → #2A2F5A) with its seeded stars, the whole time (Adam 11/17: "just night").
const STARS = (() => {
  let x = 11, out = "";
  const nx = () => (x = (x * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 140; i++) {
    out += `<circle cx="${(nx() * 1000).toFixed(1)}" cy="${(nx() * 600).toFixed(1)}" r="${(0.6 + nx() * 1.3).toFixed(2)}" fill="#fff" fill-opacity="${(0.25 + nx() * 0.6).toFixed(2)}"/>`;
  }
  return out;
})();

// units[n - 1] = the counter's word after n ("day" / "days", per locale plural rules), n = 1 … 30.
export default function GardenGrow({ title, units }: { title: string; units: string[] }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const bedRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef<HTMLDivElement | null>(null);
  const numRef = useRef<HTMLSpanElement | null>(null);
  const unitRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current, pin = pinRef.current, bed = bedRef.current;
    if (!wrap || !pin || !bed) return;
    let best = 0, lastC = -1; // best = furthest scrolled: scrolling back up never shrinks it (Adam 11/11)
    return on_scroll_frame(() => {
      best = Math.max(best, pin_progress(wrap, pin) * SPAN);
      const c = plants_at(best);
      if (Math.abs(c - lastC) < 0.002) return;
      lastC = c;
      bed.innerHTML = garden_bed(G, c, { growth, tileA, growsToday: true, soilAlways: true });
      const n = Math.max(1, Math.round(c));
      if (numRef.current) numRef.current.textContent = String(n);
      if (unitRef.current) unitRef.current.textContent = units[n - 1];
      // "1 day" comes in with the first plant, not before
      if (countRef.current) countRef.current.style.opacity = cl((c - 0.1) / 0.3).toFixed(2);
    });
  }, [units]);

  return (
    <section>
      <div ref={wrapRef} className="gg-pin-wrap">
        <div ref={pinRef} className="gg-pin">
          <div aria-hidden className="gg-sky">
            <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: STARS }} />
          </div>
          <h2>{title}</h2>
          <div ref={countRef} className="gg-count" style={{ opacity: 0 }}>
            <span ref={numRef} className="gg-num">1</span>
            <span ref={unitRef} className="gg-unit">{units[0]}</span>
          </div>
          <div ref={bedRef} className="gg-bed" />
        </div>
      </div>
    </section>
  );
}
