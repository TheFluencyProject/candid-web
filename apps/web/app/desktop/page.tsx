import type { Metadata } from "next";
import { headers } from "next/headers";
import { MAC_DOWNLOAD_URL } from "@/lib/platform";
import { pickLocale } from "@/lib/i18n-helpers";
import type { Locale } from "@/i18n/routing";

const COPY: Record<Locale, { title: string; intro: string; button: string; hint: string }> = {
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
  ja: {
    title: "Mac版Candid",
    intro: "大きな画面で練習しよう。レッスン、動画、スピーキング練習をデスクトップでそのまま。",
    button: "Mac版をダウンロード",
    hint: "macOS 26以降が必要 · 無料 · 自動アップデート",
  },
  zh: {
    title: "Mac 版 Candid",
    intro: "在大屏幕上练习。课程、视频和口语练习，直接在桌面上进行。",
    button: "下载 Mac 版",
    hint: "需要 macOS 26 或更高版本 · 免费 · 自动更新",
  },
  es: {
    title: "Candid para Mac",
    intro: "Practica en la pantalla grande. Tus lecciones, videos y práctica oral, directo en tu escritorio.",
    button: "Descargar para Mac",
    hint: "Requiere macOS 26 o posterior · Gratis · Se actualiza solo",
  },
  ru: {
    title: "Candid для Mac",
    intro: "Занимайтесь на большом экране. Уроки, видео и разговорная практика — прямо на компьютере.",
    button: "Скачать для Mac",
    hint: "Требуется macOS 26 или новее · Бесплатно · Обновляется автоматически",
  },
  fr: {
    title: "Candid pour Mac",
    intro: "Entraîne-toi sur grand écran. Tes leçons, vidéos et exercices d’oral, directement sur ton ordinateur.",
    button: "Télécharger pour Mac",
    hint: "macOS 26 ou version ultérieure requis · Gratuit · Mises à jour automatiques",
  },
  vi: {
    title: "Candid cho Mac",
    intro: "Luyện tập trên màn hình lớn. Bài học, video và luyện nói — ngay trên máy tính của bạn.",
    button: "Tải cho Mac",
    hint: "Yêu cầu macOS 26 trở lên · Miễn phí · Tự động cập nhật",
  },
  th: {
    title: "Candid สำหรับ Mac",
    intro: "ฝึกบนจอใหญ่ บทเรียน วิดีโอ และการฝึกพูด ได้บนเดสก์ท็อปของคุณเลย",
    button: "ดาวน์โหลดสำหรับ Mac",
    hint: "ต้องใช้ macOS 26 ขึ้นไป · ฟรี · อัปเดตอัตโนมัติ",
  },
  id: {
    title: "Candid untuk Mac",
    intro: "Latihan di layar besar. Pelajaran, video, dan latihan berbicara — langsung di desktopmu.",
    button: "Unduh untuk Mac",
    hint: "Butuh macOS 26 atau lebih baru · Gratis · Update otomatis",
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
  // Outside /[locale], so the header is read here instead of by the middleware.
  const copy = COPY[pickLocale((await headers()).get("accept-language"))];

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
