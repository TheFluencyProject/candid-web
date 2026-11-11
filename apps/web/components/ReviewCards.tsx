import { getTranslations } from "next-intl/server";

// Real learner reviews (App Store + in-app support chat), same card as the iOS paywall's
// Reviews stage (PaywallReviewCards.swift). Quotes live in messages under home.reviews.<id>,
// translated per locale; <b>…</b> is the bold part. Names are first names only, never localized.
const REVIEWS = [
  { id: "luke", name: "Luke" },
  { id: "madina", name: "Madina" },
  { id: "moi", name: "Moi" },
  { id: "trinity", name: "Trinity" },
  { id: "madina_new", name: "Madina" },
  { id: "camille", name: "Camille" },
  { id: "chara", name: "Chara" },
  { id: "maddie", name: "Maddie" },
] as const;

function Stars() {
  return (
    <div className="flex gap-0.5 text-[#89FFB4]" aria-label="5 stars">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.25 4.1 1 5.85L10 14.9l-5.25 2.75 1-5.85L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </div>
  );
}

export default async function ReviewCards() {
  const t = await getTranslations("home");

  // One drifting row, same seamless-loop trick as ScreenshotMarquee: two identical groups
  // (pr matches the gap so the seam is invisible), track slides -50%. Hover pauses it.
  const group = (duplicate: boolean) => (
    <div className="flex shrink-0 items-stretch gap-4 pr-4" aria-hidden={duplicate || undefined}>
      {REVIEWS.map((r) => (
        <figure
          key={r.id}
          className="flex w-[280px] md:w-[340px] shrink-0 flex-col rounded-[18px] border border-white/[0.08] bg-white/[0.05] p-[18px]"
        >
          <Stars />
          <blockquote className="mt-2 text-base leading-snug text-white/60">
            {t.rich(`reviews.${r.id}`, {
              b: (chunks) => <strong className="font-bold text-white">{chunks}</strong>,
            })}
          </blockquote>
          <figcaption className="mt-auto pt-2 text-right text-base leading-snug text-white/60">{r.name}</figcaption>
        </figure>
      ))}
    </div>
  );

  return (
    <section className="pt-4 pb-16 md:pt-12 md:pb-24 md:px-8">
      <h2 className="px-4 text-2xl md:text-4xl font-normal tracking-tight text-center mb-8 md:mb-12">
        {t("reviews_title")}
      </h2>
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="flex w-max animate-marquee [animation-duration:70s] hover:[animation-play-state:paused]">
          {group(false)}
          {group(true)}
        </div>
      </div>
    </section>
  );
}
