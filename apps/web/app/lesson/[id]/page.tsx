import type { Metadata } from "next";
import { headers } from "next/headers";

import { APP_STORE_URL, WAITLIST_URL, WAITLIST_ENABLED } from "@/lib/platform";
import { API_BASE_URL } from "@/lib/api";

const SHARE_DESCRIPTIONS: Record<"en" | "ko", string> = {
  en: "Candid is your guide to real, spoken language through a tutor's real life in the country.",
  ko: "Candid는 나만의 튜터가 보여주는 실생활 영어 프로그램입니다.",
};

interface LessonMeta {
  lesson_id: string;
  source_id: string | null;
  source_type: string;
  orientation: "vertical" | "horizontal" | null;
  title: string;
  thumbnail_url: string;
  localized_title: string;
  tutor_name: string;
}

// Returns null only for genuine 404 ("no such lesson"). Transient failures
// (timeout, 5xx, network) THROW so Next.js keeps the previous good cached
// value instead of caching the failure for the 1-week revalidate window.
async function fetchLessonMeta(id: string, locale: string): Promise<LessonMeta | null> {
  const res = await fetch(`${API_BASE_URL}/public/lessons/${id}?locale=${locale}`, {
    next: { revalidate: 604800 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`fetchLessonMeta(${id}, ${locale}): HTTP ${res.status}`);
  }
  return res.json();
}

function parseLocale(acceptLanguage: string | null): "en" | "ko" {
  if (!acceptLanguage) return "en";
  const primary = acceptLanguage.split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("ko")) return "ko";
  return "en";
}

function buildTitle(lesson: LessonMeta | null): string {
  const title = lesson?.localized_title;
  if (!title) return "Candid";
  if (lesson.tutor_name) return `${lesson.tutor_name} on Candid: ${title}`;
  return `Candid: ${title}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const headersList = await headers();
  const locale = parseLocale(headersList.get("accept-language"));
  const lesson = await fetchLessonMeta(id, locale);

  const title = buildTitle(lesson);
  const description = SHARE_DESCRIPTIONS[locale];

  return {
    metadataBase: new URL("https://joincandid.co"),
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "Candid",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LessonPage() {
  const redirectScript = `
    var ua = navigator.userAgent;
    var isIOS = /iPhone|iPad|iPod/i.test(ua);
    var dest = (${!WAITLIST_ENABLED} || isIOS) ? ${JSON.stringify(APP_STORE_URL)} : ${JSON.stringify(WAITLIST_URL)};
    window.location.replace(dest);
  `;

  return (
    <>
      <main
        style={{
          backgroundColor: "#18181C",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          color: "white",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "1.125rem", color: "#9ca3af" }}>
          Redirecting…
        </p>
        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
          <a
            href={APP_STORE_URL}
            style={{ color: "#9ca3af", textDecoration: "underline" }}
          >
            Tap here if you are not redirected
          </a>
        </p>
      </main>
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
    </>
  );
}
