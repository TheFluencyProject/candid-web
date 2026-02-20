import type { Metadata } from "next";

const API_BASE_URL = "https://dev.api.trydayli.com";
const APP_STORE_URL = "https://apps.apple.com/app/id6754859158";

interface VideoMeta {
  youtube_video_id: string;
  orientation: "vertical" | "horizontal";
  title: string;
}

async function fetchVideoMeta(id: string): Promise<VideoMeta | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/videos/${id}`, {
      next: { revalidate: 604800 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await fetchVideoMeta(id);

  const title = video ? `${video.title} — Dayli` : "Dayli";
  const description =
    "Learn English with real YouTube videos on Dayli. Open in the app to start watching.";

  return {
    metadataBase: new URL("https://daylienglish.com"),
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "Dayli",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await fetchVideoMeta(id);

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
