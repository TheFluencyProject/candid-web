import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import SiteFooter from "@/components/SiteFooter";
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

const link_class = "text-white underline underline-offset-2 hover:opacity-80";

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

  const vars = { name: invite.name, language: localizeLanguageName(invite.teaching_language, locale) };
  const t = (copy: InviteCopy) => render(pick(copy, locale), vars);
  const partners = CREATOR_INVITE_PARTNERS[invite.teaching_language];

  const h2 = "text-2xl md:text-3xl font-light text-white mt-12 mb-5";
  const h3 = "text-lg font-semibold text-white mt-6 mb-3";
  const p = "text-gray-300 text-lg leading-relaxed mb-4";
  const li = "text-gray-300 text-lg leading-relaxed pl-1";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#18181C" }}>
      <main className="min-h-screen flex-1 px-8 py-10 md:px-12 lg:px-16">
        <header className="mb-10">
          <Link href="/" className="inline-block mb-8">
            <Image
              src="/wordmark-white.svg"
              alt="Candid"
              width={60}
              height={30}
              className="hover:opacity-80 transition-opacity"
            />
          </Link>

          <h1 className="text-4xl md:text-5xl font-light text-white mb-6 [word-break:keep-all]">
            {t(COPY.headline)}
          </h1>
        </header>

        <div className="max-w-2xl [word-break:keep-all]">
          <p className={p}>{t(COPY.intro)}</p>

          <h2 className={h2}>{t(COPY.what_candid_is)}</h2>

          <h3 className={h3}>{t(COPY.for_you)}</h3>
          <ol className="list-decimal pl-6 space-y-3 mb-4">
            {COPY.for_you_items.map((item, i) => <li key={i} className={li}>{t(item)}</li>)}
          </ol>

          <h3 className={h3}>{t(COPY.for_students)}</h3>
          <p className={p}>{t(COPY.for_students_intro)}</p>
          <ol className="list-decimal pl-6 space-y-3 mb-6">
            {COPY.for_students_items.map((item, i) => <li key={i} className={li}>{t(item)}</li>)}
          </ol>
          <p className={p}>{t(COPY.feedback_intro)}</p>
          <FeedbackCarousel slides={CREATOR_INVITE_FEEDBACK} />
          <p className={p}>{t(COPY.try_app)}</p>

          <h2 className={h2}>{t(COPY.what_youll_do)}</h2>
          <p className={p}>{t(COPY.what_youll_do_intro)}</p>
          <ol className="list-decimal pl-6 space-y-3 mb-6">
            {COPY.what_youll_do_items.map((item, i) => <li key={i} className={li}>{t(item)}</li>)}
          </ol>
          <p className={p}>{t(COPY.no_requirements)}</p>
          <p className={p}>{t(COPY.our_team)}</p>

          <h2 className={h2}>{t(COPY.how_you_make_money)}</h2>
          <p className={p}>{t(COPY.revenue_share)}</p>
          <p className={p}>{t(COPY.invited_students)}</p>
          <p className={p}>{t(COPY.other_students)}</p>

          <h2 className={h2}>{t(COPY.faq)}</h2>
          <ul className="list-disc pl-6 space-y-3 mb-4">
            {COPY.faq_items.map((item, i) => <li key={i} className={li}>{t(item)}</li>)}
          </ul>

          <h2 className={h2}>{t(COPY.youre_invited)}</h2>
          {partners && <p className={p}>{t(partners)}</p>}
          <p className={p}>{t(COPY.slowly_partner)}</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
