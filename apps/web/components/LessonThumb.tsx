import BlurImage from "@/components/BlurImage";
import type { LessonMeta } from "@/lib/api";

// Height everything else in the phone viewport block takes — header, gaps, a two-line title, tutor row, CTA.
// Measured off the rendered page at the longest title we ship, not guessed. The frame gets what's left, so on a
// short screen it shrinks instead of pushing the CTA below the fold.
const RESERVED_PX = 300;

// The lesson share page's thumbnail in the tutor's focus crop; both hero arms use it. lg sizing is the caller's:
// today's hero has the text beside the frame (only the header comes off the height), the path arm has it below.
export default function LessonThumb({ lesson, lgMaxPx, lgReservedPx }: { lesson: LessonMeta; lgMaxPx: number; lgReservedPx: number }) {
  // orientation is nullable; default to vertical framing (matches shorts-style content).
  const isVertical = lesson.orientation !== "horizontal";
  // Crop height/width. Vertical gets a little more height than width; horizontal is square.
  // Both sit well under the 1.472 the dashboard FramePicker clamps the saved focus against
  // (HERO_CARD_ASPECT), so the crop can never pull blank space in above or below the square.
  const frameRatio = isVertical ? 1.2 : 1;
  const frameStyle = {
    aspectRatio: `1 / ${frameRatio}`,
    "--frame-w": `min(300px, calc((100svh - ${RESERVED_PX}px) / ${frameRatio}))`,
    "--frame-w-lg": `min(${lgMaxPx}px, calc((100svh - ${lgReservedPx}px) / ${frameRatio}))`,
  } as React.CSSProperties;
  const frameWidth = "w-[var(--frame-w)] lg:w-[var(--frame-w-lg)]";
  // Focus only ever describes a vertical source; clamp like FocusFilledWebImage does on iOS.
  const focusY =
    isVertical && typeof lesson.thumbnail_focus_y === "number"
      ? Math.min(Math.max(lesson.thumbnail_focus_y, 0), 1)
      : null;

  if (!lesson.thumbnail_url) {
    return (
      <div
        className={`shrink-0 max-w-full rounded-[1.75rem] ${frameWidth}`}
        style={{ ...frameStyle, background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
      />
    );
  }

  return (
    <div
      className={`relative shrink-0 max-w-full overflow-hidden rounded-[1.75rem] shadow-2xl ${frameWidth}`}
      style={
        focusY != null
          ? {
              ...frameStyle,
              // Fallback layer for the one case the crop below can't cover: a barely-portrait
              // source (ratio under the frame's) leaves a strip once the fill binds on width.
              // iOS re-binds on height there; here the same image, centre-cropped, fills it.
              backgroundImage: `url(${lesson.thumbnail_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : frameStyle
      }
    >
      {focusY != null ? (
        // The tutor framed a full-width SQUARE centred at focusY. iOS pins that square's top
        // to the frame top on taller-than-square cards (FocusFilledWebImage.focusYOffset), so
        // the image top sits at frameW/2 − focusY·imgH. Percentage margins resolve against the
        // containing block's WIDTH, so mt-[50%] is exactly frameW/2; translateY% resolves
        // against this wrapper's own height, which is the image's rendered height.
        // The offset lives on the wrapper because BlurImage owns the img's own transform.
        <div className="absolute inset-x-0 top-0 mt-[50%]" style={{ transform: `translateY(${-focusY * 100}%)` }}>
          <BlurImage
            src={lesson.thumbnail_url}
            alt={lesson.localized_title}
            // `auto 9/16` = use the real ratio once decoded, else assume 9:16 (same cold-load
            // guess as iOS's cachedAspect) — without it the wrapper is the 150px default
            // height until decode and the crop visibly jumps.
            className="block w-full h-auto aspect-[auto_9/16]"
          />
        </div>
      ) : (
        <BlurImage
          src={lesson.thumbnail_url}
          alt={lesson.localized_title}
          className="block w-full h-full object-cover"
        />
      )}
    </div>
  );
}
