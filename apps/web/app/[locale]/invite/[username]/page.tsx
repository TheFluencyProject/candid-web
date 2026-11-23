import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import FeedbackCarousel from "@/components/FeedbackCarousel";
import { fetchCreatorInvite } from "@/lib/api";
import { localizeLanguageName } from "@/lib/i18n-helpers";
import {
  CREATOR_INVITE_COPY as COPY,
  CREATOR_INVITE_FEEDBACK,
  CREATOR_INVITE_LINKS,
  CREATOR_INVITE_PARTNERS,
  type InviteCopy,
} from "@/lib/creator-invite-copy";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

// Personal pitch page for one creator, live only until they sign their agreement (the API 404s
// after that). English + Korean copy; every other locale falls back to English.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `Candid | ${pick(COPY.meta_title, locale)}`,
    // Personal pages must not show up in search.
    robots: { index: false, follow: false },
  };
}

function pick(copy: InviteCopy, locale: string): string {
  return copy[locale as keyof InviteCopy] ?? copy.en;
}

// Notion-style link: same color as the text, faint underline.
const link_class = "underline decoration-[rgba(240,239,237,0.35)] underline-offset-[3px] hover:decoration-[rgba(240,239,237,0.8)]";

// Notion's own font stack.
const NOTION_FONT = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

// Fills {name}/{language} and turns {app_link}/{grace}/{didi} into links.
function render(text: string, vars: { name: string; language: string }): ReactNode[] {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const key = part.match(/^\{(\w+)\}$/)?.[1];
    if (key === "name") return vars.name;
    if (key === "language") return vars.language;
    if (key && key in CREATOR_INVITE_LINKS) {
      const l = CREATOR_INVITE_LINKS[key as keyof typeof CREATOR_INVITE_LINKS];
      return <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className={link_class}>{l.label}</a>;
    }
    return part;
  });
}

export default async function CreatorInvitePage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const invite = await fetchCreatorInvite(username);
  if (!invite) notFound();

  // Some names are stored lowercase ("kelly"); the page always shows "Kelly".
  const name = invite.name.charAt(0).toUpperCase() + invite.name.slice(1);
  const vars = { name, language: localizeLanguageName(invite.teaching_language, locale) };
  const t = (copy: InviteCopy) => render(pick(copy, locale), vars);
  const partners = CREATOR_INVITE_PARTNERS[invite.teaching_language];

  // Sizes and spacing measured from a published Notion page (dark mode): title 40/700,
  // heading 30/600, sub-heading 24/600, body 16 on a 24 line with 16 between paragraphs.
  const h2 = "text-[30px] font-semibold leading-[1.3] mt-8 mb-1";
  const h3 = "text-2xl font-semibold leading-[1.3] mt-6 mb-1";
  const p = "text-base leading-6 py-2";
  const list = "pl-6 py-1";
  const li = "text-base leading-6 py-1 pl-1";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#191919", color: "rgb(240, 239, 237)", fontFamily: NOTION_FONT }}>
      <header className="px-6 pt-5 md:px-8">
        <Link href="/" className="inline-block">
          <Image
            src="/wordmark-white.svg"
            alt="Candid"
            width={60}
            height={30}
            className="hover:opacity-80 transition-opacity"
          />
        </Link>
      </header>

      {/* Bottom padding lets the last lines scroll up to the middle of the screen. */}
      <main className="mx-auto max-w-[720px] px-6 pt-16 pb-[45vh] md:pt-24 [word-break:keep-all]">
        <h1 className="text-[32px] md:text-[40px] font-bold leading-[1.2] mb-4">{t(COPY.headline)}</h1>

        <p className={p}>{t(COPY.invited)}</p>
        <p className={p}>{t(COPY.intro)}</p>

        <h2 className={h2}>{t(COPY.what_candid_is)}</h2>

        <h3 className={h3}>{t(COPY.for_you)}</h3>
        <ol className={`list-decimal ${list}`}>
          {COPY.for_you_items.map((item, i) => <li key={i} className={li}>{t(item)}</li>)}
        </ol>

        <h3 className={h3}>{t(COPY.for_students)}</h3>
        <p className={p}>{t(COPY.for_students_intro)}</p>
        <ol className={`list-decimal ${list}`}>
          {COPY.for_students_items.map((item, i) => <li key={i} className={li}>{t(item)}</li>)}
        </ol>
        <p className={p}>{t(COPY.feedback_intro)}</p>
        <FeedbackCarousel slides={CREATOR_INVITE_FEEDBACK} />
        <p className={p}>{t(COPY.try_app)}</p>

        <h2 className={h2}>{t(COPY.what_youll_do)}</h2>
        <p className={p}>{t(COPY.what_youll_do_intro)}</p>
        <ol className={`list-decimal ${list}`}>
          {COPY.what_youll_do_items.map((item, i) => <li key={i} className={li}>{t(item)}</li>)}
        </ol>
        <p className={p}>{t(COPY.no_requirements)}</p>
        <p className={p}>{t(COPY.our_team)}</p>

        <h2 className={h2}>{t(COPY.how_you_make_money)}</h2>
        <p className={p}>{t(COPY.revenue_share)}</p>
        <p className={p}>{t(COPY.invited_students)}</p>
        <p className={p}>{t(COPY.other_students)}</p>

        <h2 className={h2}>{t(COPY.faq)}</h2>
        <ul className={`list-disc ${list}`}>
          {COPY.faq_items.map((item, i) => <li key={i} className={li}>{t(item)}</li>)}
        </ul>

        <h2 className={h2}>{t(COPY.youre_invited)}</h2>
        {partners && <p className={p}>{t(partners)}</p>}
        <p className={p}>{t(COPY.slowly_partner)}</p>
      </main>
    </div>
  );
}
