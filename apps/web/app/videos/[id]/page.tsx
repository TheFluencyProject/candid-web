import type { Metadata } from "next";

import { APP_STORE_URL, WAITLIST_URL, WAITLIST_ENABLED } from "@/lib/platform";
import { API_BASE_URL } from "@/lib/api";

interface VideoMeta {
  source_id: string | null;
  source_type: string;
  orientation: "vertical" | "horizontal" | null;
  title: string;
}

// Returns null only for genuine 404 ("no such video"). Transient failures
// (timeout, 5xx, network) THROW so Next.js keeps the previous good cached
// value instead of caching the failure for the 1-week revalidate window.
async function fetchVideoMeta(id: string): Promise<VideoMeta | null> {
  const res = await fetch(`${API_BASE_URL}/public/videos/${id}`, {
    next: { revalidate: 604800 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`fetchVideoMeta(${id}): HTTP ${res.status}`);
  }
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await fetchVideoMeta(id);

  const title = video?.title ? `Candid: ${video.title}` : "Candid";
  const description =
    "Learn English with real YouTube videos on Candid. Open in the app to start watching.";

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

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await fetchVideoMeta(id);

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
