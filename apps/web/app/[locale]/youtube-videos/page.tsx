import { setRequestLocale } from "next-intl/server";
import SiteFooter from "@/components/SiteFooter";
import YoutubeVideosList from "@/components/YoutubeVideosList";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function YoutubeVideosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#18181C" }}>
      <YoutubeVideosList />
      <SiteFooter />
    </div>
  );
}
