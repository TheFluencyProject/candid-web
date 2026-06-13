"use client";

/**
 * Shared responsive overlay used by MatchIntakeOverlay (Get Matched flow on
 * candidtutors.co/) and JoinForFreeSheet (tutor sign-in modal).
 *
 *  - mobile (<lg): bottom sheet anchored to the layout viewport. Tap backdrop
 *    to dismiss. Optional `keyboardInset` lifts content above the iOS keyboard
 *    without unsticking the sheet from the bottom (see MatchIntakeOverlay for
 *    the visualViewport math that feeds this).
 *  - desktop (≥lg): centered modal-card over a dim backdrop. Tap outside the
 *    panel dismisses. Clicks on the panel stopPropagation so they don't bubble.
 *
 * Body scroll lock is owned here so consumers don't have to duplicate it.
 */

import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  // Mobile sheet — pixel height of visible portion (e.g. visualViewport.height * 0.5).
  // When null, the sheet sizes to its content.
  mobileVisibleHeight?: number | null;
  // Pixels to add as paddingBottom on the mobile sheet so content lifts above the
  // iOS keyboard while the sheet stays anchored to the layout viewport bottom.
  keyboardInset?: number;
  // Desktop modal — min-height (e.g. "600px") for forms that need vertical room.
  // Default "auto" so short sign-in panels don't waste space.
  desktopMinHeight?: string;
  // Desktop modal — Tailwind max-width class (default max-w-md).
  desktopMaxWidthClass?: string;
  // Opt-in frosted backdrop (used by the download QR overlay). Off by default so the
  // existing MatchIntake/JoinForFree consumers keep their plain dim backdrop.
  blurBackdrop?: boolean;
}

export default function ResponsiveOverlay({
  open,
  onClose,
  children,
  mobileVisibleHeight,
  keyboardInset = 0,
  desktopMinHeight = "auto",
  desktopMaxWidthClass = "max-w-md",
  blurBackdrop = false,
}: Props) {
  const blurClass = blurBackdrop ? " backdrop-blur-md" : "";
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const mobileHeight =
    mobileVisibleHeight != null ? `${mobileVisibleHeight * 0.5 + keyboardInset}px` : undefined;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] bg-black/40${blurClass}`}
        onClick={onClose}
      />
      {/* Mobile sheet */}
      <div
        className="lg:hidden fixed left-0 right-0 bottom-0 z-[70] flex flex-col rounded-t-3xl shadow-2xl"
        style={{
          // Sheet stays anchored to the LAYOUT viewport bottom (bottom: 0), so
          // the cream extends under the iOS Safari URL pill + the keyboard —
          // no dark-page gap peeking through.
          height: mobileHeight,
          paddingBottom: keyboardInset,
          backgroundColor: "#F8F5EE",
        }}
      >
        {children}
      </div>

      {/* Desktop centered modal.
          - Tap outside the panel dismisses. Clicks on the panel stopPropagation
            so they don't bubble to the backdrop.
          - Darker backdrop (bg-black/75) so the underlying page is visibly
            de-emphasized. */}
      <div
        className={`hidden lg:flex fixed inset-0 z-[70] items-center justify-center p-6 bg-black/75${blurClass}`}
        onClick={onClose}
      >
        <div
          className={`w-full ${desktopMaxWidthClass} max-h-[90vh] rounded-3xl shadow-2xl flex flex-col`}
          style={{ backgroundColor: "#F8F5EE", minHeight: desktopMinHeight }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
}
