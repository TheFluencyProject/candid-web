// Seamless infinite marquee (pure CSS, no JS). Two identical groups sit flush
// in the track; the track translates left by exactly one group's width (-50%),
// so group 2 lands precisely where group 1 began — no seam at the loop point.
//
// Two details keep the loop from "skipping":
//   1. Each group carries pr-* equal to its internal gap, so the spacing across
//      the group→group boundary matches the spacing between items. Padding (not
//      a trailing margin) is always included in the box width, so -50% is exact.
//   2. Each image uses a fixed aspect-ratio box (screenshots are all 2000x4069),
//      so a lazy image reserves its width before it loads. Without this the
//      width would pop from 0 on load, shifting the -50% target mid-scroll.
export default function ScreenshotMarquee({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  const renderGroup = (duplicate: boolean) => (
    <div className="flex shrink-0 gap-4 md:gap-6 pr-4 md:pr-6" aria-hidden={duplicate || undefined}>
      {urls.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          draggable={false}
          loading="lazy"
          className="h-[380px] md:h-[460px] aspect-[2000/4069] object-cover rounded-[2rem] shadow-2xl select-none"
        />
      ))}
    </div>
  );

  return (
    <div className="group overflow-hidden w-full py-4 md:py-8">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {renderGroup(false)}
        {renderGroup(true)}
      </div>
    </div>
  );
}
