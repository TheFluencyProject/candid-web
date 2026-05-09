import { ImageResponse } from "next/og";
import { API_BASE_URL } from "@/lib/api";

export const revalidate = 604800; // 1 week

export const alt = "Watch on Candid";

export const size = {
  width: 1080,
  height: 1920,
};

export const contentType = "image/png";

interface LessonMeta {
  lesson_id: string;
  source_id: string | null;
  source_type: string;
  orientation: "vertical" | "horizontal" | null;
  title: string;
  thumbnail_url: string;
}

// See lesson/[id]/page.tsx for the rationale: throw on transient errors
// so Next.js keeps the last good cached OG image instead of poisoning the
// 1-week cache with a fallback image generated during a brief API outage.
async function fetchLessonMeta(id: string): Promise<LessonMeta | null> {
  const res = await fetch(`${API_BASE_URL}/public/lessons/${id}`, {
    next: { revalidate: 604800 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`fetchLessonMeta(${id}): HTTP ${res.status}`);
  }
  return res.json();
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

  const lesson = await fetchLessonMeta(id);

  if (!lesson || (!lesson.thumbnail_url && !lesson.source_id)) {
    // Fallback: solid dark background
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: "#18181C",
          }}
        />
      ),
      {
        ...size,
        headers: {
          "Cache-Control": "public, max-age=604800, immutable",
        },
      }
    );
  }

  // Use backend thumbnail_url if available, otherwise resolve from YouTube
  let thumbnailUrl: string;
  if (lesson.thumbnail_url) {
    thumbnailUrl = lesson.thumbnail_url;
  } else if (lesson.source_id) {
    thumbnailUrl = await resolveYoutubeThumbnail(
      lesson.source_id,
      lesson.orientation
    );
  } else {
    thumbnailUrl = "";
  }

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
        {/* Thumbnail as background */}
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
        {/* Dark gradient overlay */}
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
