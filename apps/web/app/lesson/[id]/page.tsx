import type { Metadata } from "next";
import { headers } from "next/headers";

const API_BASE_URL = "https://api.joincandid.co";
const APP_STORE_URL = "https://apps.apple.com/app/id6754859158";

interface LessonMeta {
  lesson_id: string;
  source_id: string | null;
  source_type: string;
  orientation: "vertical" | "horizontal" | null;
  title: string;
  thumbnail_url: string;
  localized_title: string;
  tutor_name: string;
  teaching_language: string;
}

async function fetchLessonMeta(id: string, locale: string): Promise<LessonMeta | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/lessons/${id}?locale=${locale}`, {
      next: { revalidate: 604800 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function parseLocale(acceptLanguage: string | null): "en" | "ko" {
  if (!acceptLanguage) return "en";
  const primary = acceptLanguage.split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("ko")) return "ko";
  return "en";
}

function buildTitle(lesson: LessonMeta | null): string {
  if (!lesson) return "Candid";
  const { localized_title, tutor_name, teaching_language } = lesson;
  if (teaching_language && tutor_name && localized_title) {
    const lang = teaching_language.charAt(0).toUpperCase() + teaching_language.slice(1);
    return `${lang} with ${tutor_name}: ${localized_title}`;
  }
  return localized_title || "Candid";
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
  const description =
    "Learn with real YouTube videos on Candid. Open in the app to start watching.";

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

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const locale = parseLocale(headersList.get("accept-language"));
  await fetchLessonMeta(id, locale);

  return (
    <>
      <main
        style={{
          backgroundColor: "#131212",
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
          Opening in App Store…
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
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(APP_STORE_URL)});`,
        }}
      />
    </>
  );
}
