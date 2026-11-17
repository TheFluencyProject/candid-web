import type { Tutor } from "@/lib/api";

// The people row under the hero (mockup C2, Adam 11/11–11/17): the Korean creators' faces drifting by,
// 7:8 cards with the name over a bottom gradient. Never all tutors at once as a list or grid, no count:
// just a row that keeps moving. Pure CSS loop like ScreenshotMarquee: the group is rendered twice and the
// track slides -50%, each group carrying a trailing pr- equal to its gap so the loop has no seam.
// No hover pause, no reduced-motion opt-out (same as the screenshot row).
export default function TutorRoster({ title, subtitle, tutors }: { title: string; subtitle: string; tutors: Tutor[] }) {
  if (tutors.length === 0) return null;

  const renderGroup = (duplicate: boolean) => (
    <div className="flex shrink-0 gap-[14px] pr-[14px]" aria-hidden={duplicate || undefined}>
      {tutors.map((t) => (
        <div
          key={t.slug}
          className="relative w-[160px] min-[600px]:w-[220px] aspect-[7/8] shrink-0 overflow-hidden rounded-[14px] min-[600px]:rounded-[20px] bg-[#222]"
        >
          {/* Large photo when the tutor has one, else the profile photo (Grace, Ellie, Tina, Didi). */}
          <img
            src={(t.large_profile_picture_url || t.profile_picture_url) ?? undefined}
            alt=""
            draggable={false}
            className="h-full w-full object-cover object-[center_25%] select-none"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-black/60" />
          <span className="absolute left-[11px] bottom-[9px] min-[600px]:left-4 min-[600px]:bottom-[13px] text-base min-[600px]:text-xl font-medium">
            {t.name}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    // Each section fills one screen under the top bar (Adam 11/17), the row centered in it.
    <section className="flex min-h-[calc(100svh-61px)] flex-col justify-center overflow-hidden py-16">
      {/* "Not another AI tutor" moved here from the hero (Adam 11/17). */}
      <div className="mx-auto mb-10 max-w-[760px] px-6 text-center [word-break:keep-all] min-[860px]:mb-14">
        <h2 className="text-[30px] font-medium leading-[1.08] tracking-[-0.03em] [text-wrap:balance] min-[860px]:text-[clamp(36px,4vw,54px)]">{title}</h2>
        <p className="mt-4 text-base leading-normal text-gray-300 [text-wrap:balance] min-[860px]:text-[19px]">{subtitle}</p>
      </div>
      <div className="mx-auto w-full max-w-[1040px] [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
        <div className="flex w-max animate-drift">
          {renderGroup(false)}
          {renderGroup(true)}
        </div>
      </div>
    </section>
  );
}
