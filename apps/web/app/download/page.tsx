import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { APP_STORE_URL } from "@/lib/platform";

// Slug-less App Clip landing for /download. On a clip-capable iPhone (iOS 18+) the middleware
// renders this page instead of redirecting, so Safari surfaces the App Clip card from the
// apple-itunes-app meta tag; the body is the App Store fallback for clip-incapable clients. Mirrors
// /download/[slug] minus the tutor-specific hero. app-id is the App Store fallback for iOS versions
// below the clip's iOS 18 minimum.
const APP_CLIP_META =
  "app-id=6754859158, app-clip-bundle-id=co.thefluencyproject.bloom-ios.Clip, app-clip-display=card";

// This route lives outside /[locale], so detect ko/en from the header directly (mirrors middleware).
async function resolveLocale(): Promise<"en" | "ko"> {
  const al = (await headers()).get("accept-language") ?? "";
  return al.split(",")[0]?.trim().toLowerCase().startsWith("ko") ? "ko" : "en";
}

const COPY = {
  en: { hint: "Tap the banner above to start instantly — or download the full app.", alt: "Download on the App Store" },
  ko: { hint: "위 배너를 눌러 바로 시작하거나, 앱을 다운로드하세요.", alt: "App Store에서 다운로드" },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL("https://joincandid.co"),
    title: "Candid",
    other: { "apple-itunes-app": APP_CLIP_META },
  };
}

export default async function DownloadLanding() {
  const copy = COPY[await resolveLocale()];

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12"
      style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
    >
      <h1 className="text-3xl font-semibold mb-8">Candid</h1>
      <a href={APP_STORE_URL}>
        <Image src="/download.svg" alt={copy.alt} width={160} height={52} priority />
      </a>
      <p className="text-sm mt-6 max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        {copy.hint}
      </p>
    </main>
  );
}
