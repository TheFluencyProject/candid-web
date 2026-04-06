"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";

interface YoutubeVideo {
  youtube_video_id: string;
  youtube_video_title: string;
}

interface PaginatedResponse {
  videos: YoutubeVideo[];
  has_more: boolean;
}

const API_BASE_URL = "https://api.joincandid.co";
const PAGE_SIZE = 50;

export default function YoutubeVideosPage() {
  const t = useTranslations("youtube_videos");
  const footerT = useTranslations("footer");
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchVideos = async (
    currentOffset: number,
    isInitial: boolean = false
  ) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const url = `${API_BASE_URL}/public/youtube-videos?offset=${currentOffset}&limit=${PAGE_SIZE}`;
      console.log("Fetching:", url);

      const response = await fetch(url);

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(
          `Failed to fetch videos: ${response.status} ${errorText}`
        );
      }

      const responseText = await response.text();
      console.log("Response body:", responseText);

      const data: PaginatedResponse = JSON.parse(responseText);
      console.log("Parsed data:", data);

      if (isInitial) {
        setVideos(data.videos);
      } else {
        setVideos((prev) => [...prev, ...data.videos]);
      }

      setHasMore(data.has_more);
      setOffset(currentOffset + data.videos.length);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      if (isInitial) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    fetchVideos(0, true);
  }, []);

  const handleLoadMore = () => {
    fetchVideos(offset, false);
  };

  return (
    <main
      className="min-h-screen px-8 py-10 md:px-12 lg:px-16"
      style={{ backgroundColor: "#131212" }}
    >
      {/* Header */}
      <header className="mb-10">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/wordmark-white.svg"
            alt="Candid"
            width={60}
            height={30}
            className="hover:opacity-80 transition-opacity"
          />
        </Link>

        <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
          {t("title")}
        </h1>

        <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl">
          {t("description_1")}
        </p>

        <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl mt-4">
          {t("description_2")}
        </p>

        <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl mt-4">
          {t("description_3")}
        </p>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-gray-400 text-lg">
            {t("loading")}
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-red-400 text-lg">{error}</div>
        </div>
      ) : (
        <>
          <div className="space-y-3 max-w-3xl">
            {videos.map((video) => (
              <a
                key={video.youtube_video_id}
                href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  group
                  flex
                  items-center
                  justify-between
                  py-4
                  px-6
                  rounded-lg
                  border
                  border-white/20
                  border-[0.3px]
                  bg-white/5
                  hover:bg-white/10
                  transition-colors
                "
              >
                {/* Title */}
                <span className="text-white text-base pr-4">
                  {video.youtube_video_title}
                </span>

                {/* External link arrow */}
                <svg
                  className="w-5 h-5 text-gray-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 17L17 7M17 7H7M17 7V17"
                  />
                </svg>
              </a>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8 max-w-3xl">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="
                  px-8
                  py-3
                  rounded-lg
                  border
                  border-white/20
                  border-[0.3px]
                  bg-white/5
                  hover:bg-white/10
                  text-white
                  text-base
                  font-medium
                  transition-colors
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {isLoadingMore ? t("loading") : t("load_more")}
              </button>
            </div>
          )}
        </>
      )}
      <SiteFooter privacyLabel={footerT("privacy")} termsLabel={footerT("terms")} />
    </main>
  );
}
