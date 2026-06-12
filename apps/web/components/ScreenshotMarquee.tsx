// Pure-CSS infinite marquee (no JS). The list is rendered twice and the track
// slides left by 50%, where the duplicate seamlessly takes over. Each item uses
// margin-right (not flex `gap`) so the -50% translate lands exactly on the loop
// point with no seam.
export default function ScreenshotMarquee({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  const loop = [...urls, ...urls];
  return (
    <div className="group overflow-hidden w-full py-4 md:py-8">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {loop.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            aria-hidden={i >= urls.length}
            draggable={false}
            loading="lazy"
            className="h-[380px] md:h-[460px] w-auto mr-4 md:mr-6 rounded-[2rem] shadow-2xl select-none"
          />
        ))}
      </div>
    </div>
  );
}
