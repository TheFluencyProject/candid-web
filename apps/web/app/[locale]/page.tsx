import Image from "next/image";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations();

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-between px-8 py-7"
      style={{
        backgroundColor: "#131212",
      }}
    >
      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          {/* App Icon */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/dayli-wordmark.svg"
              alt="Dayli Logo"
              width={112}
              height={195}
              priority
            />
          </div>

          {/* Tagline */}
          <p
            className="text-3xl mb-12"
            style={{
              fontWeight: 300,
              color: "#FFFFFF",
            }}
          >
            {t("home.tagline")}
            <br className="md:hidden" />
          </p>

          {/* Download button */}
          <Link href="/join" className="inline-block">
            <Image
              src="/download.svg"
              alt={t("home.download_alt")}
              width={170}
              height={55}
              className="hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>
      </div>

      {/* Footer links */}
      <footer className="flex gap-8 items-center justify-center">
        <Link
          href="/privacy"
          className="text-lg hover:opacity-70 transition-opacity"
          style={{
            color: "#FFFFFF",
          }}
        >
          {t("footer.privacy")}
        </Link>
        <Link
          href="/terms"
          className="text-lg hover:opacity-70 transition-opacity"
          style={{
            color: "#FFFFFF",
          }}
        >
          {t("footer.terms")}
        </Link>
        <Link
          href="/youtube-videos"
          className="text-lg hover:opacity-70 transition-opacity"
          style={{
            color: "#FFFFFF",
          }}
        >
          {t("footer.youtube_videos")}
        </Link>
      </footer>
    </main>
  );
}
