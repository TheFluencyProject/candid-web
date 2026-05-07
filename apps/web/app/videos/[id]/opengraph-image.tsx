import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { API_BASE_URL } from "@/lib/api";

export const revalidate = 604800; // 1 week

export const alt = "Watch on Candid";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

interface VideoMeta {
  source_id: string | null;
  source_type: string;
  orientation: "vertical" | "horizontal" | null;
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

async function resolveYoutubeThumbnail(
  youtube_video_id: string,
  orientation: "vertical" | "horizontal" | null
): Promise<string> {
  // Vertical videos have portrait thumbnails via oar1.jpg; fall back to hqdefault if missing
  if (orientation === "vertical") {
    const verticalUrl = `https://i.ytimg.com/vi/${youtube_video_id}/oar1.jpg`;
    try {
      const res = await fetch(verticalUrl, {
        method: "HEAD",
        next: { revalidate: 604800 },
      });
      if (res.ok) return verticalUrl;
    } catch {
      // fall through to hqdefault
    }
  }
  return `https://img.youtube.com/vi/${youtube_video_id}/hqdefault.jpg`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [video, logoData] = await Promise.all([
    fetchVideoMeta(id),
    readFile(join(process.cwd(), "public", "wordmark-white.svg")),
  ]);

  const logoSrc = `data:image/svg+xml;base64,${logoData.toString("base64")}`;

  if (!video || !video.source_id) {
    // Fallback image: dark background with logo only
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: "#18181C",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={logoSrc} width={120} height={68} />
        </div>
      ),
      {
        ...size,
        headers: {
          "Cache-Control": "public, max-age=604800, immutable",
        },
      }
    );
  }

  const thumbnailUrl = await resolveYoutubeThumbnail(
    video.source_id,
    video.orientation
  );

return new ImageResponse(
  (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#18181C",
      }}
    >
      {/* YouTube thumbnail as background */}
      <img
        src={thumbnailUrl}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {/* Dark gradient overlay so logo is readable */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(to bottom right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)",
          display: "flex",
        }}
      />
      {/* Candid logo — top right */}
      <img
        src={logoSrc}
        width={96}
        height={54}
        style={{
          position: "absolute",
          top: 28,
          right: 28,
        }}
      />
    </div>
  ),
  {
    ...size,
    headers: {
      "Cache-Control": "public, max-age=604800, immutable",
    },
  }
);
}
