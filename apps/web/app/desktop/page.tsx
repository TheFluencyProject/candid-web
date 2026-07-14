import type { Metadata } from "next";
import { headers } from "next/headers";
import { MAC_DOWNLOAD_URL } from "@/lib/platform";

// Top-level route (outside /[locale]) — detect ko/en from the header directly, mirroring the
// middleware and the sibling /download page.
async function resolveLocale(): Promise<"en" | "ko"> {
  const al = (await headers()).get("accept-language") ?? "";
  return al.split(",")[0]?.trim().toLowerCase().startsWith("ko") ? "ko" : "en";
}

const COPY = {
  en: {
    title: "Candid for Mac",
    intro:
      "Practice on the big screen. Your lessons, videos, and speaking practice — right on your desktop.",
    button: "Download for Mac",
    hint: "Requires macOS 26 or later · Free · Updates automatically",
  },
  ko: {
    title: "Mac용 Candid",
    intro: "큰 화면에서 연습하세요. 레슨, 영상, 말하기 연습을 데스크탑에서 바로.",
    button: "Mac용 다운로드",
    hint: "macOS 26 이상 필요 · 무료 · 자동 업데이트",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL("https://joincandid.co"),
    title: "Candid for Mac",
    description: "Download Candid for macOS — lessons, videos, and speaking practice on your desktop.",
  };
}

export default async function DesktopLanding() {
  const copy = COPY[await resolveLocale()];

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12"
      style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
    >
      <h1 className="text-4xl font-semibold mb-4">{copy.title}</h1>
      <p className="text-base mb-10 max-w-md" style={{ color: "rgba(255,255,255,0.6)" }}>
        {copy.intro}
      </p>
      {/* Links straight to the S3 DMG (served with Content-Disposition: attachment), so the click
          downloads the file and leaves the user on this page. MAC_DOWNLOAD_URL is the single source
          of truth shared with the middleware /download/mac redirect. */}
      <a
        href={MAC_DOWNLOAD_URL}
        className="inline-flex items-center rounded-full px-8 py-4 text-base font-semibold transition-transform hover:scale-[1.03]"
        style={{ backgroundColor: "#89FFB4", color: "#18181C" }}
      >
        {copy.button}
      </a>
      <p className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        {copy.hint}
      </p>
    </main>
  );
}
