"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MarketingClip } from "@/lib/api";
import MarketingClipCard from "./MarketingClipCard";

// Continuous drift speed; roughly matches the old CSS marquee's slow pace.
const SCROLL_SPEED_PX_PER_SEC = 38;

// useLayoutEffect on the server warns; fall back to useEffect there (the centered-card pick
// it runs is client-only anyway).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// A horizontally drifting, drag-scrollable row of live clips. Motion is driven by a
// translateX transform (NOT scrollLeft): it's subpixel-accurate so the slow drift works on
// iOS (scrollLeft rounds sub-pixel writes to 0 there), and it wraps via modulo so the row
// scrolls infinitely in both directions instead of hitting the end of two copies. Drag uses
// pointer events with a touch axis-lock so a vertical swipe still scrolls the page. Exactly
// one card plays at a time and follows the viewport center as you drag.
export default function MarketingClipMarquee({ clips }: { clips: MarketingClip[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null); // viewport (clips the track)
  const trackRef = useRef<HTMLDivElement | null>(null); // the translated 2-group track
  const offsetRef = useRef(0); // current translateX, kept wrapped to [0, groupWidth)
  const groupWidthRef = useRef(0);
  const pausedRef = useRef(false); // drift paused while the user drags
  const dragRef = useRef({ dragging: false, pending: false, startX: 0, startY: 0, startOffset: 0 });
  const centerRafRef = useRef(0); // coalesces the during-drag "which card is centered" recompute
  const lastClipIdRef = useRef<string | null>(null);
  const velRef = useRef(0); // offset velocity (px/ms) sampled during drag, for release momentum
  const lastMoveRef = useRef({ x: 0, t: 0 });
  const momentumRafRef = useRef(0);

  // Null until the layout effect below picks the visually-centered card (pre-paint). Can't seed
  // a specific card here: the useState init has no layout, and the centered card depends on the
  // viewport width — hardcoding card 0 plays the leftmost (off-centre) one.
  const [autoKey, setAutoKey] = useState<string | null>(null);
  const autoKeyRef = useRef<string | null>(autoKey);
  autoKeyRef.current = autoKey; // mirror for the rAF loop (no stale closure)
  const [inView, setInView] = useState<Set<string>>(() => new Set());
  // Mobile cold start: load ONLY the centered video first (one hls.js/MMS pipeline → fast first
  // frame; 3 concurrent pipelines stall iOS for several seconds). Flip true once that clip is
  // actually playing, then neighbors prebuffer so switches stay instant. Desktop ignores this.
  const [coldStartDone, setColdStartDone] = useState(false);
  const handle_ready = useCallback(() => setColdStartDone(true), []);

  // The card under autoKey is THE playing card. It follows the viewport center while you
  // drag, plays its segment once, then hands off to the near-center card. Hovering a card
  // (real mouse movement) also makes it autoKey.

  // Warm the hls.js chunk on mount so the first clip doesn't wait on its (lazy) download.
  useEffect(() => {
    import("hls.js").catch(() => {});
  }, []);

  const group_width = () => {
    const track = trackRef.current;
    return track ? track.scrollWidth / 2 : 0; // two identical groups
  };

  // Write the wrapped offset to the track. Modulo by one group width → seamless infinite loop
  // (group 2 is an identical copy, so a ±groupWidth jump is invisible).
  const set_offset = (v: number) => {
    const gw = groupWidthRef.current || group_width();
    groupWidthRef.current = gw;
    const off = gw > 0 ? ((v % gw) + gw) % gw : v;
    offsetRef.current = off;
    const track = trackRef.current;
    if (track) track.style.transform = `translate3d(${-off}px,0,0)`;
  };

  // Nearest card to the viewport center (rects reflect the live transform), optionally
  // excluding a just-played clip id.
  const pick_nearest_center = useCallback((exclude_clip_id: string | null): string | null => {
    const root = containerRef.current;
    if (!root) return null;
    const rootRect = root.getBoundingClientRect();
    const center_x = rootRect.left + rootRect.width / 2;
    let best: { key: string; dist: number } | null = null;
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-key]"))) {
      if (exclude_clip_id && el.getAttribute("data-clip-id") === exclude_clip_id) continue;
      const rect = el.getBoundingClientRect();
      // No viewport filter: the globally-nearest card to centre is always the on-screen one
      // (its duplicate is a whole group width away), and skipping the filter guarantees we
      // never return null when cards exist — so a video is always chosen to play.
      const dist = Math.abs(rect.left + rect.width / 2 - center_x);
      if (!best || dist < best.dist) best = { key: el.getAttribute("data-key")!, dist };
    }
    return best?.key ?? null;
  }, []);

  // Which cards are near the viewport (gates video loading). Computed from rects rather than
  // an IntersectionObserver since the cards move by transform, not scroll.
  const recompute_inview = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    const margin = 120; // preload just the centered card + immediate neighbors (~3 streams):
    // enough that the next clip is ready before it centers, without the ~6 concurrent streams
    // that strain mobile Safari.
    setInView((prev) => {
      const next = new Set<string>();
      for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-key]"))) {
        const rect = el.getBoundingClientRect();
        if (rect.right >= rootRect.left - margin && rect.left <= rootRect.right + margin) {
          const k = el.getAttribute("data-key");
          if (k) next.add(k);
        }
      }
      if (next.size === prev.size && [...next].every((k) => prev.has(k))) return prev; // no change
      return next;
    });
  }, []);

  // Update the playing card to whatever is centered — coalesced to one recompute per frame so
  // a fast drag doesn't thrash layout.
  const request_center_update = useCallback(() => {
    if (centerRafRef.current) return;
    centerRafRef.current = requestAnimationFrame(() => {
      centerRafRef.current = 0;
      const k = pick_nearest_center(null);
      if (k) setAutoKey(k);
      recompute_inview(); // keep cards near centre loaded as you drag, so the next one plays sooner
    });
  }, [pick_nearest_center, recompute_inview]);

  // ── Continuous drift via transform. Paused while dragging. ──
  useEffect(() => {
    if (clips.length === 0) return;
    let raf = 0;
    let last = 0;
    let sinceInview = 0;
    // 1.5x faster on mobile (<768px, Tailwind md breakpoint) than desktop.
    const speed = (typeof window !== "undefined" && window.innerWidth < 768)
      ? SCROLL_SPEED_PX_PER_SEC * 1.5
      : SCROLL_SPEED_PX_PER_SEC;
    const step = (ts: number) => {
      const dt = last ? ts - last : 0;
      last = ts;
      if (!pausedRef.current && dt > 0) {
        // measure here too, so the drift starts on the first frame even if the measure effect
        // hasn't run yet (mobile first paint can lag) — was "doesn't move immediately on mobile"
        if (groupWidthRef.current <= 0) groupWidthRef.current = group_width();
        if (groupWidthRef.current > 0) set_offset(offsetRef.current + (speed * dt) / 1000);
      }
      // Safety net: if nothing is playing (a pick race on load, or a settle that found
      // nothing), choose a centered card so a video is always playing.
      if (!autoKeyRef.current) {
        const k = pick_nearest_center(null);
        if (k) {
          autoKeyRef.current = k;
          setAutoKey(k);
        }
      }
      sinceInview += dt;
      if (sinceInview >= 200) {
        sinceInview = 0;
        recompute_inview();
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [clips.length, recompute_inview, pick_nearest_center]);

  // Measure one group's width (cached so the drift loop never reads scrollWidth per frame),
  // set the initial in-view set + first playing card, and re-measure on resize.
  useEffect(() => {
    const measure = () => {
      const t = trackRef.current;
      if (t) groupWidthRef.current = t.scrollWidth / 2;
      recompute_inview();
    };
    measure();
    const settleRaf = requestAnimationFrame(measure); // re-measure once layout settles
    const initRaf = requestAnimationFrame(() => setAutoKey((k) => k ?? pick_nearest_center(null)));
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(settleRaf);
      cancelAnimationFrame(initRaf);
      window.removeEventListener("resize", measure);
    };
  }, [clips, recompute_inview, pick_nearest_center]);

  // Pick the visually-centered card as the first playing one, BEFORE first paint — so it (not
  // the leftmost card) starts loading immediately and there's no flash of the wrong card.
  useIsomorphicLayoutEffect(() => {
    const k = pick_nearest_center(null);
    if (k) setAutoKey(k);
  }, [pick_nearest_center]);

  // End of a drag/scroll: resume drift and recompute the centered playing card.
  const settle = useCallback(() => {
    if (centerRafRef.current) {
      cancelAnimationFrame(centerRafRef.current);
      centerRafRef.current = 0;
    }
    pausedRef.current = false;
    recompute_inview();
    setAutoKey((prev) => pick_nearest_center(null) ?? prev); // never clear to null
  }, [pick_nearest_center, recompute_inview]);

  // Trackpad / wheel horizontal scroll. There's no native scroll to lean on (the track is a
  // transform), so move the offset here. Native non-passive listener so we can preventDefault
  // the horizontal wheel (otherwise it triggers the browser's back/forward swipe); a vertical
  // wheel is left alone so the page still scrolls.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let endTimer = 0;
    const on_wheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
      if (dx === 0) return; // vertical → let the page scroll
      e.preventDefault();
      pausedRef.current = true;
      set_offset(offsetRef.current + dx);
      request_center_update(); // playing card follows the center while scrolling
      clearTimeout(endTimer);
      endTimer = window.setTimeout(settle, 140);
    };
    el.addEventListener("wheel", on_wheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", on_wheel);
      clearTimeout(endTimer);
    };
  }, [clips.length, settle, request_center_update]);

  // Stop any in-flight momentum / center rAFs on unmount.
  useEffect(() => () => {
    if (momentumRafRef.current) cancelAnimationFrame(momentumRafRef.current);
    if (centerRafRef.current) cancelAnimationFrame(centerRafRef.current);
  }, []);

  // Release momentum: glide on with the flick velocity, decelerating, then hand to the drift —
  // so letting go of a drag keeps scrolling naturally instead of stopping dead.
  const start_momentum = () => {
    if (performance.now() - lastMoveRef.current.t > 100) velRef.current = 0; // a held release: no throw
    if (Math.abs(velRef.current) < 0.08) { settle(); return; } // too slow to be a flick
    let last = performance.now();
    const step = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      set_offset(offsetRef.current + velRef.current * dt);
      request_center_update();
      velRef.current *= Math.pow(0.95, dt / 16.67); // frame-rate-independent friction
      if (Math.abs(velRef.current) < 0.04) { // decayed to ~drift speed → let the drift take over
        momentumRafRef.current = 0;
        settle();
        return;
      }
      momentumRafRef.current = requestAnimationFrame(step);
    };
    momentumRafRef.current = requestAnimationFrame(step);
  };

  // ── Drag. Mouse drags immediately; touch waits one move to lock horizontal vs vertical so
  //    a vertical swipe still scrolls the page (touch-action: pan-y). ──
  const on_pointer_down = (e: React.PointerEvent) => {
    if (momentumRafRef.current) { cancelAnimationFrame(momentumRafRef.current); momentumRafRef.current = 0; }
    velRef.current = 0;
    lastMoveRef.current = { x: e.clientX, t: performance.now() };
    if (e.pointerType === "mouse") {
      dragRef.current = { dragging: true, pending: false, startX: e.clientX, startY: e.clientY, startOffset: offsetRef.current };
      pausedRef.current = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    } else {
      dragRef.current = { dragging: false, pending: true, startX: e.clientX, startY: e.clientY, startOffset: offsetRef.current };
    }
  };

  const on_pointer_move = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d.pending) {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; // wait for a clear direction
      if (Math.abs(dx) > Math.abs(dy)) {
        d.dragging = true;
        d.pending = false;
        pausedRef.current = true;
        velRef.current = 0;
        lastMoveRef.current = { x: e.clientX, t: performance.now() }; // baseline for flick velocity
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      } else {
        d.pending = false; // vertical → let the browser scroll the page
        return;
      }
    }
    if (d.dragging) {
      set_offset(d.startOffset - (e.clientX - d.startX));
      const now = performance.now();
      const dt = now - lastMoveRef.current.t;
      if (dt > 0) {
        const inst = -(e.clientX - lastMoveRef.current.x) / dt; // offset velocity (px/ms)
        velRef.current = velRef.current * 0.7 + inst * 0.3; // light smoothing for the flick
        lastMoveRef.current = { x: e.clientX, t: now };
      }
      request_center_update(); // playing card follows the center DURING the drag
      return;
    }
    // Hover-to-play (mouse only, real movement only — a transform-drifted row must not swap
    // the playing card as cards slide under a stationary cursor).
    if (e.pointerType !== "mouse" || (e.movementX === 0 && e.movementY === 0)) return;
    const card = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest("[data-key]");
    const key = card?.getAttribute("data-key");
    if (key && key !== autoKey) setAutoKey(key);
  };

  const on_pointer_up = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const was_dragging = d.dragging;
    dragRef.current = { dragging: false, pending: false, startX: 0, startY: 0, startOffset: 0 };
    if (was_dragging) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      start_momentum(); // glide on from the flick, then settle into the drift
    }
  };

  const active_clip_id = autoKey ? autoKey.split("::")[1] : null;
  useEffect(() => {
    if (active_clip_id) lastClipIdRef.current = active_clip_id;
  }, [active_clip_id]);

  const handle_segment_end = useCallback(() => {
    setAutoKey(pick_nearest_center(lastClipIdRef.current));
  }, [pick_nearest_center]);

  if (clips.length === 0) return null;

  // On mobile, gate neighbor prebuffering behind the first clip playing (coldStartDone); desktop
  // handles concurrent streams fine, so it always prebuffers in-view neighbors.
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const prebuffer_neighbors = !isMobile || coldStartDone;

  const render_group = (group_idx: number, duplicate: boolean) => (
    <div className="flex shrink-0 gap-4 md:gap-6 pr-4 md:pr-6" aria-hidden={duplicate || undefined}>
      {clips.map((clip) => {
        const key = `${group_idx}::${clip.caption_segment_id}`;
        return (
          <MarketingClipCard
            key={key}
            dataKey={key}
            clip={clip}
            isActive={autoKey === key}
            // Always load the active card (so a long clip never blanks mid-play before it hands
            // off); load in-view neighbors only once prebuffering is allowed (always on desktop;
            // on mobile, after the first clip is playing — avoids the cold-start pipeline pileup).
            shouldLoad={autoKey === key || (prebuffer_neighbors && inView.has(key))}
            onSegmentEnd={handle_segment_end}
            onReady={handle_ready}
          />
        );
      })}
    </div>
  );

  return (
    <div
      ref={containerRef}
      onPointerDown={on_pointer_down}
      onPointerMove={on_pointer_move}
      onPointerUp={on_pointer_up}
      onPointerCancel={on_pointer_up}
      className="w-full overflow-hidden select-none py-4 md:py-8 [touch-action:pan-y]"
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        {render_group(0, false)}
        {render_group(1, true)}
      </div>
    </div>
  );
}
