import { getTranslations } from "next-intl/server";
import ReviewSlider from "@/components/ReviewSlider";

// Real learner reviews (App Store + in-app support chat), same card as the iOS paywall's
// Reviews stage (PaywallReviewCards.swift). Quotes live in messages under home.reviews.<id>,
// translated per locale; <b>…</b> is the bold part. Names are first names only, never localized.
// ORDER = SHOW ORDER, strongest sell first. The slider starts at the top of this list.
const REVIEWS = [
  { id: "madina_new", name: "Madina" }, // my favorite way to learn Korean — always first
  { id: "luke", name: "Luke" }, // best Korean app, better than Duolingo + Memrise
  { id: "moi", name: "Moi" }, // stands out vs bunpo + TTMIK
  { id: "camille", name: "Camille" }, // Korean Mode lock = accountability
  { id: "madina", name: "Madina" }, // natural and enjoyable
  { id: "trinity", name: "Trinity" }, // love the app, relatable videos
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

async function reviewCards() {
  const t = await getTranslations("home");
  // Solid gray, not white/60: an alpha color fades emoji too. #A7A7A9 is what white/60
  // rendered as on this card (white/5 over #18181C), so the text itself looks the same.
  return REVIEWS.map((r) => (
    <figure
      key={r.id}
      className="flex h-full flex-col rounded-[18px] border border-white/[0.08] bg-white/[0.05] p-[18px]"
    >
      <Stars />
      <blockquote className="mt-2 text-[17px] md:text-lg leading-snug text-[#A7A7A9]">
        {t.rich(`reviews.${r.id}`, {
          b: (chunks) => <strong className="font-medium text-white">{chunks}</strong>,
        })}
      </blockquote>
      <figcaption className="mt-auto pt-2 text-right text-[17px] md:text-lg leading-snug text-[#A7A7A9]">{r.name}</figcaption>
    </figure>
  ));
}

export default async function ReviewCards() {
  const t = await getTranslations("home");
  return (
    <section className="pt-16 pb-32 md:pt-32 md:pb-48">
      <h2 className="px-4 text-2xl md:text-4xl font-normal tracking-tight text-center mb-8 md:mb-10">
        {t("reviews_title")}
      </h2>
      <ReviewSlider cards={await reviewCards()} />
    </section>
  );
}
