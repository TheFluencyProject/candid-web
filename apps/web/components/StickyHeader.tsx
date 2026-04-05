"use client";

import { useEffect, useRef, useState } from "react";

export default function StickyHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const navHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--navbar-height") || "64"
    );

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: `-${navHeight}px 0px 0px 0px` }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Sentinel — when this scrolls out, the header is stuck */}
      <div ref={sentinelRef} className="h-0 w-full" />
      <div
        className="sticky z-20 py-4 md:py-5 px-6 md:px-12 transition-all duration-300"
        style={{
          top: "var(--navbar-height, 64px)",
          backgroundColor: isStuck ? "rgba(255,255,255,0.05)" : "transparent",
          backdropFilter: isStuck ? "blur(24px)" : "none",
          WebkitBackdropFilter: isStuck ? "blur(24px)" : "none",
        }}
      >
        {children}
      </div>
    </>
  );
}
