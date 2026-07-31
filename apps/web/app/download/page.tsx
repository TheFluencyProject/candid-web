import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { APP_STORE_URL } from "@/lib/platform";
import { pickLocale } from "@/lib/i18n-helpers";

// Slug-less App Store landing for /download. App Clip funnel is disabled for now — the middleware
// always redirects /download to the App Store, so this body only renders for clip-incapable clients
// reached some other way. The apple-itunes-app App Clip meta is commented out below; uncomment it
// (and re-enable the middleware appClip branch) to bring the App Clip card back.
// const APP_CLIP_META =
//   "app-id=6754859158, app-clip-bundle-id=co.thefluencyproject.bloom-ios.Clip, app-clip-display=card";

const COPY = {
  en: { hint: "Tap the banner above to start instantly — or download the full app.", alt: "Download on the App Store" },
  ko: { hint: "위 배너를 눌러 바로 시작하거나, 앱을 다운로드하세요.", alt: "App Store에서 다운로드" },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL("https://joincandid.co"),
    title: "Candid",
    // App Clip funnel disabled — uncomment to surface the App Clip card again.
    // other: { "apple-itunes-app": APP_CLIP_META },
  };
}

export default async function DownloadLanding() {
  // Outside /[locale], so the header is read here instead of by the middleware.
  const copy = COPY[pickLocale((await headers()).get("accept-language"))];

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
