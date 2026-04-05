"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";

export interface CarouselTutor {
  slug: string;
  firstName: string;
  city: string | null;
  bgImage: string;
  coolTitle: string;
  subtitle: string;
  photoPosition: { desktop: string; mobile: string };
  arrowPosition: {
    desktop: { top: string; left: string; rotation?: string };
    mobile: { top: string; right: string; rotation?: string };
  };
}

const AUTO_ADVANCE_MS = 5000;

export default function HeroCarousel({ tutors }: { tutors: CarouselTutor[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  // Reset timer and start progress animation
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / AUTO_ADVANCE_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        clearInterval(timerRef.current!);
        // Auto-advance
        setIsTransitioning(true);
        setCurrentIndex((i) => (i + 1) % tutors.length);
        setTimeout(() => setIsTransitioning(false), 450);
      }
    }, 30);
  }, [tutors.length]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  // Reset timer when index changes
  useEffect(() => {
    resetTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentIndex) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 450);
    },
    [isTransitioning, currentIndex]
  );

  const advance = useCallback(() => {
    if (isTransitioning || tutors.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((i) => (i + 1) % tutors.length);
    setTimeout(() => setIsTransitioning(false), 450);
  }, [isTransitioning, tutors.length]);

  const goBack = useCallback(() => {
    if (isTransitioning || tutors.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((i) => (i - 1 + tutors.length) % tutors.length);
    setTimeout(() => setIsTransitioning(false), 450);
  }, [isTransitioning, tutors.length]);

  if (tutors.length === 0) return null;
  const tutor = tutors[currentIndex];

  return (
    <div
      className="mx-3 md:mx-6 mb-16 md:mb-24"
      style={{
        marginTop: "var(--navbar-height, 52px)",
      }}
    >
      <div
        className="relative rounded-3xl md:rounded-[2.5rem] overflow-hidden cursor-pointer select-none"
        style={{
          height: "calc(100svh - var(--navbar-height, 60px) - 36px)",
        }}
        onClick={advance}
      >
        {/* Background images — all preloaded, only active one visible */}
        {tutors.map((t, i) => (
          <div
            key={t.slug}
            className="absolute inset-0 transition-opacity duration-[400ms] ease-in-out"
            style={{ opacity: i === currentIndex ? 1 : 0 }}
          >
            {/* Desktop */}
            <img
              src={t.bgImage}
              alt={t.firstName}
              className="hidden lg:block absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: t.photoPosition.desktop }}
            />
            {/* Mobile — scale-[1.15] matches tutor guide pages */}
            <img
              src={t.bgImage}
              alt={t.firstName}
              className="block lg:hidden absolute inset-0 w-full h-full object-cover scale-[1.15] origin-bottom"
              style={{ objectPosition: t.photoPosition.mobile }}
            />
          </div>
        ))}

        {/* Gradient overlays — same as tutor pages */}
        {/* Desktop: bottom fade */}
        <div
          className="hidden lg:block absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 70%, rgba(19,18,18,0.6) 100%)",
          }}
        />
        {/* Mobile: stronger bottom fade */}
        <div
          className="block lg:hidden absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 30%, rgba(19,18,18,0.3) 45%, rgba(19,18,18,0.5) 55%, rgba(19,18,18,0.65) 70%, rgba(19,18,18,0.75) 85%)",
          }}
        />

        {/* Content overlay — fades with tutor change */}
        <div
          key={tutor.slug}
          className="absolute inset-0 z-10 animate-carouselFadeIn"
        >
          {/* Desktop text — left side, no card bg, same as tutor pages */}
          <div className="hidden lg:flex flex-col justify-start absolute inset-y-0 left-0 px-12 pt-12 pb-24">
            <h1
              className="hero-heading text-5xl xl:text-6xl font-light leading-[1.15] mb-6"
              style={{ color: "#131212" }}
              dangerouslySetInnerHTML={{ __html: tutor.coolTitle }}
            />
            <p
              className="text-base xl:text-lg font-light leading-relaxed max-w-md"
              style={{ color: "#131212", opacity: 0.7 }}
              dangerouslySetInnerHTML={{ __html: tutor.subtitle }}
            />
          </div>

          {/* Mobile text — bottom, centered, same as tutor pages */}
          <div className="flex lg:hidden absolute inset-x-0 bottom-0 z-10 flex-col items-center justify-end px-6 pb-16 text-center">
            <h1
              className="hero-heading text-3xl sm:text-4xl font-light leading-tight mb-4"
              style={{ color: "#FFFFFF" }}
              dangerouslySetInnerHTML={{ __html: tutor.coolTitle }}
            />
            <p
              className="text-base font-normal leading-relaxed max-w-sm [&_br]:hidden"
              style={{ color: "rgba(255,255,255,0.7)" }}
              dangerouslySetInnerHTML={{ __html: tutor.subtitle }}
            />
          </div>

          {/* "Tutor [Name]" label + arrow — Desktop (same layout as tutor pages: flex-col) */}
          <div
            className="hidden lg:flex absolute flex-col items-center"
            style={{
              opacity: 0,
              top: tutor.arrowPosition.desktop.top,
              left: tutor.arrowPosition.desktop.left,
              transform: tutor.arrowPosition.desktop.rotation
                ? `rotate(${tutor.arrowPosition.desktop.rotation})`
                : undefined,
            }}
          >
            <img
              src="/curved-arrow.png"
              alt=""
              className="w-12 h-12 -mb-2"
            />
            <span
              className="text-2xl text-white"
              style={{ fontFamily: "'Sriracha', cursive" }}
            >
              Tutor {tutor.firstName}
            </span>
          </div>

          {/* "Tutor [Name]" label + arrow — Mobile (same layout as tutor pages: flex-col) */}
          <div
            className="flex lg:hidden absolute flex-col items-center"
            style={{
              opacity: 0,
              top: tutor.arrowPosition.mobile.top,
              right: tutor.arrowPosition.mobile.right,
              transform: tutor.arrowPosition.mobile.rotation
                ? `rotate(${tutor.arrowPosition.mobile.rotation})`
                : undefined,
            }}
          >
            <img
              src="/curved-arrow.png"
              alt=""
              className="w-9 h-9 -mb-1"
            />
            <span
              className="text-lg text-white"
              style={{ fontFamily: "'Sriracha', cursive" }}
            >
              Tutor {tutor.firstName}
            </span>
          </div>

          {/* Desktop: App Store badge bottom-left */}
          <a
            href="/download"
            className="hidden lg:block absolute bottom-8 left-8 hover:opacity-90 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src="/download.svg"
              alt="Download on the App Store"
              width={140}
              height={46}
            />
          </a>
        </div>

        {/* Pagination: left dot, center pill with progress, right dot */}
        <div
          className="absolute bottom-4 md:bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left dot — go back */}
          <button
            onClick={goBack}
            className="flex items-center justify-center"
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "none",
              cursor: "pointer",
            }}
          />

          {/* Center pill — city name with progress fill */}
          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{
              height: 28,
              borderRadius: 14,
              padding: "0 16px",
              backgroundColor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
            }}
          >
            {/* Progress fill */}
            <div
              className="absolute inset-0"
              style={{
                background: "rgba(255,255,255,0.85)",
                transformOrigin: "left",
                transform: `scaleX(${progress})`,
                transition: progress === 0 ? "none" : "transform 30ms linear",
              }}
            />
            <span
              className="relative text-xs font-semibold whitespace-nowrap uppercase tracking-wide"
              style={{
                color: progress > 0.5 ? "#131212" : "rgba(255,255,255,0.9)",
                transition: "color 200ms ease",
              }}
            >
              {(tutor.city?.split(",")[0]?.trim()) || tutor.firstName}
            </span>
          </div>

          {/* Right dot — go forward */}
          <button
            onClick={advance}
            className="flex items-center justify-center"
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "none",
              cursor: "pointer",
            }}
          />
        </div>

        {/* Sentinel for navbar scroll detection */}
        <div id="hero-sentinel" className="absolute bottom-0 h-0 w-full" />
      </div>

    </div>
  );
}
