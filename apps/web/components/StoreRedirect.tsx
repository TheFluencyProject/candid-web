"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  detectInAppBrowser,
  escapeToNativeBrowser,
  isAndroid,
  isIOS,
  isInAppBrowser,
  type InAppBrowserFamily,
} from "@/lib/in-app-browser";

// How long to give the escape before assuming the webview swallowed it. The successful case
// backgrounds this page well inside this window, so a timeout means we're still stuck.
const ESCAPE_TIMEOUT_MS = 1800;
// After a manual tap, how long before we give up on the scheme and spell out the ⋯ menu steps.
const MANUAL_TIMEOUT_MS = 1500;

const APP_LABEL: Record<InAppBrowserFamily, string> = {
  instagram: "Instagram",
  threads: "Threads",
  messenger: "Messenger",
  facebook: "Facebook",
  tiktok: "TikTok",
};

const COPY = {
  en: {
    heading: "Taking you to Candid…",
    body: "Hang tight, we're opening the App Store.",
    stuckHeading: "Almost there",
    stuckBody: (app: string) =>
      `${app} blocked the store link. Tap below to open it in your normal browser.`,
    cta: "Get Candid",
    manualTitle: "Open in your browser to download",
    manualBody: (app: string) =>
      `${app} blocks App Store links inside its built-in browser. Open this page in your normal browser to continue.`,
    manualIntro: "Or do it by hand:",
    steps: {
      instagram: "Tap ⋯ in the top right, then “Open in external browser”.",
      threads: "Tap ⋯ in the top right, then “Open in external browser”.",
      messenger: "Tap ⋯ in the bottom right, then “Open in browser”.",
      facebook: "Tap ⋯ in the bottom right, then “Open in browser”.",
      tiktok: "Tap ⋯ in the top right, then “Open in browser”.",
      generic: "Tap the ⋯ menu, then “Open in browser”.",
    },
    copy: "Copy link",
    copied: "Link copied",
    close: "Close",
    noscript: "Download Candid on the App Store",
  },
  ko: {
    heading: "Candid 앱으로 이동 중…",
    body: "App Store를 여는 중이에요. 잠시만 기다려 주세요.",
    stuckHeading: "거의 다 왔어요",
    stuckBody: (app: string) =>
      `${app}에서 App Store 링크를 차단했어요. 아래를 눌러 기본 브라우저에서 열어 주세요.`,
    cta: "Candid 받기",
    manualTitle: "브라우저에서 열어 주세요",
    manualBody: (app: string) =>
      `${app}의 인앱 브라우저에서는 App Store 링크가 열리지 않아요. 기본 브라우저에서 이 페이지를 열어 주세요.`,
    manualIntro: "직접 여는 방법:",
    steps: {
      instagram: "오른쪽 위 ⋯ 를 누르고 ‘외부 브라우저에서 열기’를 선택하세요.",
      threads: "오른쪽 위 ⋯ 를 누르고 ‘외부 브라우저에서 열기’를 선택하세요.",
      messenger: "오른쪽 아래 ⋯ 를 누르고 ‘브라우저에서 열기’를 선택하세요.",
      facebook: "오른쪽 아래 ⋯ 를 누르고 ‘브라우저에서 열기’를 선택하세요.",
      tiktok: "오른쪽 위 ⋯ 를 누르고 ‘브라우저에서 열기’를 선택하세요.",
      generic: "⋯ 메뉴를 누르고 ‘브라우저에서 열기’를 선택하세요.",
    },
    copy: "링크 복사",
    copied: "링크가 복사됐어요",
    close: "닫기",
    noscript: "App Store에서 Candid 받기",
  },
};

type Props = { storeUrl: string };

export default function StoreRedirect({ storeUrl }: Props) {
  // Outside /[locale], so there's no next-intl context — pick from navigator in the effect below.
  // English first paint is safe: the only copy a user actually reads is the stuck state, which
  // can't appear until ESCAPE_TIMEOUT_MS after the effect has already swapped the language.
  const [copy, setCopy] = useState(COPY.en);
  const [family, setFamily] = useState<InAppBrowserFamily | null>(null);
  const [stuck, setStuck] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [copied, setCopied] = useState(false);
  // Ref, not state: the listeners that set this fire during teardown, when a re-render never lands.
  const leftPage = useRef(false);

  useEffect(() => {
    if (navigator.language?.toLowerCase().startsWith("ko")) setCopy(COPY.ko);

    const detected = detectInAppBrowser();
    setFamily(detected);

    // A real browser (or desktop) can follow the store link itself — nothing to escape from.
    if (!detected || (!isIOS() && !isAndroid())) {
      window.location.replace(storeUrl);
      return;
    }

    // No escape for this webview (iOS TikTok) — try the store link anyway. It won't hand off, but
    // the timeout below then surfaces the manual steps rather than leaving a blank page.
    if (!escapeToNativeBrowser(storeUrl)) window.location.replace(storeUrl);

    const onVisibility = () => { if (document.hidden) leftPage.current = true; };
    const onPageHide = () => { leftPage.current = true; };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    const timer = window.setTimeout(() => {
      if (!leftPage.current) setStuck(true);
    }, ESCAPE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [storeUrl]);

  const onCtaClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // In a real browser the href does the right thing on its own.
    if (!isInAppBrowser()) return;
    e.preventDefault();
    if (!escapeToNativeBrowser(storeUrl)) window.location.href = storeUrl;
    window.setTimeout(() => setShowManual(true), MANUAL_TIMEOUT_MS);
  }, [storeUrl]);

  const onCopy = useCallback(() => {
    // Best effort: the URL below is user-selectable, so a rejected clipboard isn't a dead end.
    navigator.clipboard?.writeText(storeUrl).then(() => setCopied(true), () => {});
  }, [storeUrl]);

  const appLabel = family ? APP_LABEL[family] : "This app";
  const step = family ? copy.steps[family] : copy.steps.generic;

  return (
    <main
      className="min-h-dvh grid place-items-center px-6 py-10 text-center"
      style={{ backgroundColor: "#18181C", color: "#FFFFFF" }}
    >
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          {stuck ? copy.stuckHeading : copy.heading}
        </h1>
        <p className="mb-8 text-base" style={{ color: "rgba(255,255,255,0.55)" }}>
          {stuck ? copy.stuckBody(appLabel) : copy.body}
        </p>
        <a
          href={storeUrl}
          onClick={onCtaClick}
          className="block rounded-full bg-white px-8 py-4 text-lg font-semibold active:scale-[0.98] transition-transform"
          style={{ color: "#18181C" }}
        >
          {copy.cta}
        </a>
      </div>

      <noscript>
        <a href={storeUrl} style={{ color: "#FFFFFF", textDecoration: "underline" }}>
          {COPY.en.noscript}
        </a>
      </noscript>

      {showManual && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowManual(false)}
          />
          <div
            className="relative w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-3xl p-6 text-left"
            style={{ backgroundColor: "#232329" }}
          >
            <h2 className="text-xl font-semibold mb-2">{copy.manualTitle}</h2>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
              {copy.manualBody(appLabel)}
            </p>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
              <b style={{ color: "#FFFFFF" }}>{copy.manualIntro} </b>
              {step}
            </p>
            <div className="flex items-center gap-2 rounded-xl py-2 pl-3 pr-2" style={{ backgroundColor: "#18181C" }}>
              <code
                className="flex-1 min-w-0 truncate font-mono text-xs select-all"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {storeUrl}
              </code>
              <button
                type="button"
                onClick={onCopy}
                className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ backgroundColor: "#FFFFFF", color: "#18181C" }}
              >
                {copied ? copy.copied : copy.copy}
              </button>
            </div>
            <button
              type="button"
              aria-label={copy.close}
              onClick={() => setShowManual(false)}
              className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full text-xl leading-none"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
