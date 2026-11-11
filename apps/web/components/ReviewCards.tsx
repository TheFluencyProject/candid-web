import { getTranslations } from "next-intl/server";
import ReviewRotator from "@/components/ReviewRotator";

// Real learner reviews (App Store + in-app support chat), same card as the iOS paywall's
// Reviews stage (PaywallReviewCards.swift). Quotes live in messages under home.reviews.<id>,
// translated per locale; <b>…</b> is the bold part. Names are first names only, never localized.
// ORDER = SHOW ORDER: strongest sell first (beats named competitors → "favorite way to learn"
// → concrete features → general love). The rotator starts at the top of this list.
const REVIEWS = [
  { id: "luke", name: "Luke" }, // best Korean app, better than Duolingo + Memrise
  { id: "madina_new", name: "Madina" }, // my favorite way to learn Korean
  { id: "moi", name: "Moi" }, // stands out vs bunpo + TTMIK
  { id: "camille", name: "Camille" }, // Korean Mode lock = accountability
  { id: "madina", name: "Madina" }, // natural and enjoyable
  { id: "trinity", name: "Trinity" }, // love the app, relatable videos
  { id: "maddie", name: "Maddie" }, // consistent every day
  { id: "chara", name: "Chara" }, // something special
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

  const cards = REVIEWS.map((r) => (
    <figure
      key={r.id}
      className="flex h-full flex-col rounded-[18px] border border-white/[0.08] bg-white/[0.05] p-[18px]"
    >
      <Stars />
      <blockquote className="mt-2 text-base leading-snug text-white/60">
        {t.rich(`reviews.${r.id}`, {
          b: (chunks) => <strong className="font-bold text-white">{chunks}</strong>,
        })}
      </blockquote>
      <figcaption className="mt-auto pt-2 text-right text-base leading-snug text-white/60">{r.name}</figcaption>
    </figure>
  ));

  return (
    <section className="pt-4 pb-16 md:pt-12 md:pb-24">
      <h2 className="px-4 text-2xl md:text-4xl font-normal tracking-tight text-center mb-8 md:mb-10">
        {t("reviews_title")}
      </h2>
      <ReviewRotator cards={cards} />
    </section>
  );
}
