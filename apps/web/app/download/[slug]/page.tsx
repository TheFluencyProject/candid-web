import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { fetchTutor } from "@/lib/api";
import { APP_STORE_URL } from "@/lib/platform";

// The App Clip is invoked from this URL. The apple-itunes-app meta tag makes iOS Safari surface
// the App Clip card; the page body is the fallback for clip-incapable iOS, in-app browsers, etc.
// app-id is the App Store fallback for iOS versions below the clip's iOS 18 minimum.
const APP_CLIP_META =
  "app-id=6754859158, app-clip-bundle-id=co.thefluencyproject.bloom-ios.Clip, app-clip-display=card";

type Props = { params: Promise<{ slug: string }> };

// This route lives outside /[locale], so detect ko/en from the header directly (mirrors middleware).
async function resolveLocale(): Promise<"en" | "ko"> {
  const al = (await headers()).get("accept-language") ?? "";
  return al.split(",")[0]?.trim().toLowerCase().startsWith("ko") ? "ko" : "en";
}

const COPY = {
  en: { hint: "Tap the banner above to start instantly — or download the full app.", alt: "Download on the App Store" },
  ko: { hint: "위 배너를 눌러 바로 시작하거나, 앱을 다운로드하세요.", alt: "App Store에서 다운로드" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tutor = await fetchTutor(slug, await resolveLocale());
  return {
    metadataBase: new URL("https://joincandid.co"),
    title: tutor ? `Candid — ${tutor.name}` : "Candid",
    other: { "apple-itunes-app": APP_CLIP_META },
  };
}

export default async function DownloadLanding({ params }: Props) {
  const { slug } = await params;
  const locale = await resolveLocale();
  const tutor = await fetchTutor(slug, locale);
  if (!tutor) notFound();

  const copy = COPY[locale];
  const heroImage =
    tutor.large_profile_picture_url || tutor.web_bg_picture_url || tutor.personal_photo_urls?.[0] || null;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12"
      style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
    >
      {heroImage && (
        // Plain <img> direct from S3 — bypasses the /_next/image transcode hop (matches tutor page).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroImage} alt={tutor.name} className="w-32 h-32 rounded-full object-cover mb-6 shadow-2xl" />
      )}
      <h1 className="text-3xl font-semibold mb-2">{tutor.name}</h1>
      {tutor.cool_title && (
        <p className="text-base font-light mb-8 max-w-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
          {tutor.cool_title.replace(/\n/g, " ")}
        </p>
      )}
      <a href={APP_STORE_URL}>
        <Image src="/download.svg" alt={copy.alt} width={160} height={52} priority />
      </a>
      <p className="text-sm mt-6 max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        {copy.hint}
      </p>
    </main>
  );
}
