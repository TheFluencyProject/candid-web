"use client";

import { useEffect, useRef, useState } from "react";

// Image that fades + unblurs as it scrolls into view. Self-contained — does not
// rely on parent ScrollFadeIn — so the animation is always anchored to the
// image's own intersection rect, not a sibling header or section.
export default function BlurImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={`transition-[opacity,filter] duration-700 ease-out ${
        isVisible ? "opacity-100 blur-0" : "opacity-0 blur-2xl"
      } ${className}`}
    />
  );
}
