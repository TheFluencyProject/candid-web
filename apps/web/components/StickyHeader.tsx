"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export default function StickyHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isStuck, setIsStuck] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);

  const checkStuck = useCallback(() => {
    const el = stickyRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const stickyTop = parseFloat(getComputedStyle(el).top) || 0;

    // Element is stuck when its top equals its CSS `top` value (within 1px tolerance)
    setIsStuck(Math.abs(rect.top - stickyTop) < 1);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", checkStuck, { passive: true });
    checkStuck();
    return () => window.removeEventListener("scroll", checkStuck);
  }, [checkStuck]);

  return (
    <div
      ref={stickyRef}
      className="sticky z-20 py-4 md:py-5 px-6 md:px-12"
      style={{
        top: "var(--navbar-height, 64px)",
        backgroundColor: isStuck ? "rgba(255,255,255,0.05)" : "transparent",
        backdropFilter: isStuck ? "blur(24px)" : "none",
        WebkitBackdropFilter: isStuck ? "blur(24px)" : "none",
      }}
    >
      {children}
    </div>
  );
}
