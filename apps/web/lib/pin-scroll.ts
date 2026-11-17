// Scroll progress through a pinned section: `wrap` is the tall wrapper, `pin` the sticky child inside it.
// 0 when the pin first sticks, 1 when it's about to unstick. Measured from the pin's own sticky `top` (under
// the fixed top bar), not the viewport top: measuring from 0 froze each section for one top-bar height of
// scroll right as it pinned (Adam 11/17, "little hitch").
export function pin_progress(wrap: HTMLElement, pin: HTMLElement): number {
  const r = wrap.getBoundingClientRect();
  const stick = parseFloat(getComputedStyle(pin).top) || 0;
  return Math.min(1, Math.max(0, (stick - r.top) / (r.height - pin.clientHeight)));
}

// Calls `update` on scroll (rAF-throttled) and resize, once now; returns the cleanup.
export function on_scroll_frame(update: () => void): () => void {
  let queued = false;
  let raf = 0;
  const on_scroll = () => {
    if (queued) return;
    queued = true;
    raf = requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  window.addEventListener("scroll", on_scroll, { passive: true });
  window.addEventListener("resize", update);
  update();
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", on_scroll);
    window.removeEventListener("resize", update);
  };
}
