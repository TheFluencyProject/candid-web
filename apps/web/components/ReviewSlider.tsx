"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const INTERVAL_MS = 5000;
const GAP = 16;

/** True while ≥60% of the element is on screen. */
function useOnScreen(ref: RefObject<HTMLElement | null>) {
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return onScreen;
}

// Three dots: previous, current, next. The current one is a pill whose fill grows over
// INTERVAL_MS; its animationend is what advances, so pausing the fill pauses the slider
// too and the two can never drift apart. `step` keys the fill so it restarts per card.
function ProgressDots({
  step,
  running,
  onPrev,
  onNext,
}: {
  step: number;
  running: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-center gap-2">
      <button
        onClick={onPrev}
        aria-label="Previous review"
        className="h-1.5 w-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
      />
      <div className="h-1.5 w-8 overflow-hidden rounded-full bg-white/20">
        <div
          key={step}
          className="h-full w-full origin-left rounded-full bg-white/60"
          style={{
            animation: `review-progress ${INTERVAL_MS}ms linear forwards`,
            animationPlayState: running ? "running" : "paused",
          }}
          onAnimationEnd={onNext}
        />
      </div>
      <button
        onClick={onNext}
        aria-label="Next review"
        className="h-1.5 w-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
      />
    </div>
  );
}

/**
 * Focus slider: the current card sits centered at full strength, its neighbours peek in
 * dimmed on both sides (tap one to jump to it), and every 5s the row slides one card left.
 * Swipe (touch), drag (mouse) or two-finger scroll (trackpad) moves by hand; a far drag
 * can skip several cards. Runs only while on screen, so visitors arriving from the hero
 * start on the first (strongest) review, and pauses only mid-drag (never on hover).
 *
 * Loop: cards are rendered 3× and we start on the middle copy. When a slide lands outside
 * the middle copy, the position snaps back by one copy with transitions off — same card,
 * same pixel spot — so it loops forever without a visible rewind.
 */
export default function ReviewSlider({ cards }: { cards: ReactNode[] }) {
  const n = cards.length;
  const [pos, setPos] = useState(n);
  const [instant, setInstant] = useState(false);
  const [offset, setOffset] = useState(0);
  const [dragDx, setDragDx] = useState<number | null>(null); // null = not dragging
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, dx: 0, moved: false });
  const wheelLock = useRef(0);
  const wheelAcc = useRef(0);
  const onScreen = useOnScreen(wrap);

  const cardStep = () => ((track.current?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 280) + GAP;
  // Keep inside the 3 copies even if someone taps faster than a slide finishes
  // (settle only runs once a slide ends).
  const move = (d: number) => setPos((p) => Math.min(3 * n - 2, Math.max(1, p + d)));

  // Pointer drag (touch + mouse). Window listeners so a drag that leaves the card still ends.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, dx: 0, moved: false };
    setDragDx(0);
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - drag.current.x;
      drag.current.dx = dx;
      if (Math.abs(dx) > 6) drag.current.moved = true;
      setDragDx(dx);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      const dx = drag.current.dx;
      let steps = Math.round(-dx / cardStep());
      if (steps === 0 && Math.abs(dx) > 40) steps = dx < 0 ? 1 : -1;
      setDragDx(null);
      if (steps) move(steps);
      // The click a drag ends with fires right after pointerup; clear the flag once it has,
      // so a drag that ended off-card can't swallow the next real tap.
      setTimeout(() => (drag.current.moved = false), 0);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  // Trackpad two-finger horizontal scroll: one card per gesture. Non-passive so
  // preventDefault stops the browser's swipe-back navigation over the slider.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (Date.now() < wheelLock.current) return;
      wheelAcc.current += e.deltaX;
      if (Math.abs(wheelAcc.current) > 40) {
        move(wheelAcc.current > 0 ? 1 : -1);
        wheelAcc.current = 0;
        wheelLock.current = Date.now() + 750;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useLayoutEffect(() => {
    const measure = () => {
      const w = wrap.current?.clientWidth ?? 0;
      const cw = (track.current?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
      setOffset(w / 2 - (pos * (cw + GAP) + cw / 2));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pos]);

  const settle = () => {
    if (pos >= 2 * n || pos < n) {
      setInstant(true);
      setPos((p) => (p >= 2 * n ? p - n : p + n));
      requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    }
  };

  return (
    <div ref={wrap}>
      <div className="overflow-hidden">
        <div
          ref={track}
          className={`flex items-stretch touch-pan-y select-none cursor-grab active:cursor-grabbing ${
            instant || dragDx !== null ? "" : "transition-transform duration-700 ease-out"
          }`}
          style={{ gap: GAP, transform: `translateX(${offset + (dragDx ?? 0)}px)` }}
          onTransitionEnd={(e) => e.target === track.current && settle()}
          onPointerDown={onPointerDown}
          onDragStart={(e) => e.preventDefault()}
          // A drag ends with a click on whatever card is under the pointer — swallow it.
          onClickCapture={(e) => {
            if (drag.current.moved) {
              e.stopPropagation();
              drag.current.moved = false;
            }
          }}
        >
          {[...cards, ...cards, ...cards].map((card, k) => (
            <div
              key={k}
              onClick={() => k !== pos && setPos(k)}
              className={`w-[280px] md:w-[400px] shrink-0 ${instant ? "" : "transition-all duration-700"} ${
                k === pos ? "opacity-100" : "opacity-30 scale-[0.94] cursor-pointer hover:opacity-50"
              }`}
              aria-hidden={k !== pos}
            >
              {card}
            </div>
          ))}
        </div>
      </div>
      <ProgressDots
        step={pos % n}
        running={onScreen && dragDx === null}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
      />
    </div>
  );
}
