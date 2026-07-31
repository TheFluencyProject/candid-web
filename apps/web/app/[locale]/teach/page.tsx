import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import SiteFooter from "@/components/SiteFooter";

type Props = {
  params: Promise<{ locale: string }>;
};

// Replaces the old external Notion page the "teach" CTA used to open, which had no
// Korean version. Same copy, on-site, so it follows the locale like every other route.
export default async function TeachPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("teach");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#18181C" }}>
      <main className="flex-1 px-8 py-10 md:px-12 lg:px-16">
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

          <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
            {t("title")}
          </h1>
        </header>

        <div className="max-w-2xl">
          {/* whitespace-pre-line: the Korean copy carries a \n to control its line break. */}
          <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line mb-6">
            {t("subtitle")}
          </p>
          <p className="text-white/50 text-base leading-relaxed">
            {t("invite_only")}
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
