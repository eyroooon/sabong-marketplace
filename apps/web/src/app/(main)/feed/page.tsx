"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { VideoCard } from "@/components/feed/video-card";

export default function FeedPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"foryou" | "marketplace">("foryou");
  const [videos, setVideos] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchVideos = useCallback(
    async (cursor?: string) => {
      try {
        const params = new URLSearchParams();
        if (activeTab === "marketplace") params.set("type", "marketplace");
        if (cursor) params.set("cursor", cursor);
        params.set("limit", "10");

        const res = await apiGet<any>(
          `/videos?${params.toString()}`,
          accessToken || undefined,
        );

        if (cursor) {
          setVideos((prev) => [...prev, ...(res.data || [])]);
        } else {
          setVideos(res.data || []);
        }
        setNextCursor(res.nextCursor);
        setHasMore(!!res.nextCursor);
      } catch {
        if (!cursor) setVideos([]);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, accessToken],
  );

  // Fetch on tab change
  useEffect(() => {
    setLoading(true);
    setVideos([]);
    setNextCursor(null);
    setActiveIndex(0);
    fetchVideos();
  }, [activeTab, fetchVideos]);

  // Intersection Observer for active video detection + infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            setActiveIndex(idx);

            // Load more when reaching last 2 videos
            if (idx >= videos.length - 2 && hasMore && nextCursor) {
              fetchVideos(nextCursor);
            }
          }
        });
      },
      { threshold: 0.7 },
    );

    const items = containerRef.current?.querySelectorAll("[data-index]");
    items?.forEach((item) => observerRef.current?.observe(item));

    return () => observerRef.current?.disconnect();
  }, [videos, hasMore, nextCursor, fetchVideos]);

  return (
    <div className="relative flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Tab selector — sticky overlay on top of videos */}
      <div className="absolute left-0 right-0 top-0 z-30 flex justify-center gap-4 pt-3">
        <button
          onClick={() => setActiveTab("foryou")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
            activeTab === "foryou"
              ? "bg-white text-black"
              : "bg-black/30 text-white/70 backdrop-blur-sm"
          }`}
        >
          For You
        </button>
        <button
          onClick={() => setActiveTab("marketplace")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
            activeTab === "marketplace"
              ? "bg-white text-black"
              : "bg-black/30 text-white/70 backdrop-blur-sm"
          }`}
        >
          Marketplace
        </button>
      </div>

      {/* Upload button */}
      <Link
        href="/feed/upload"
        className="absolute bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 md:bottom-6"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>

      {/* Video feed */}
      {loading && videos.length === 0 ? (
        <div className="flex flex-1 items-center justify-center bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center bg-black text-white">
          <svg className="h-16 w-16 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <p className="mt-4 text-lg font-medium">No videos yet</p>
          <p className="mt-1 text-sm text-white/60">
            Be the first to share a video!
          </p>
          <Link
            href="/feed/upload"
            className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-medium"
          >
            Upload Video
          </Link>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 snap-y snap-mandatory overflow-y-scroll bg-black"
          style={{ scrollSnapType: "y mandatory" }}
        >
          {videos.map((video, index) => (
            <div
              key={video.id}
              data-index={index}
              className="h-full w-full snap-start"
              style={{ scrollSnapAlign: "start" }}
            >
              <VideoCard video={video} isActive={index === activeIndex} />
            </div>
          ))}

          {/* Loading more indicator */}
          {hasMore && (
            <div className="flex h-20 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
