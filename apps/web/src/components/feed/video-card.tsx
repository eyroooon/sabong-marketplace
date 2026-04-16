"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { apiPost, apiDelete } from "@/lib/api";
import { HeartAnimation } from "./heart-animation";

interface VideoCardProps {
  video: {
    id: string;
    userId: string;
    type: string;
    caption: string;
    videoUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    isLiked?: boolean;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    listing: {
      id: string;
      title: string;
      slug: string;
      price: number;
      breed: string | null;
      category: string;
    } | null;
  };
  isActive: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001";

export function VideoCard({ video, isActive }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { accessToken, isAuthenticated } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(video.isLiked || false);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [showHeart, setShowHeart] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lastTapRef = useRef(0);

  // Autoplay/pause based on isActive
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isActive) {
      el.play().catch(() => {});
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      el.play().catch(() => {});
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap → like
      if (!liked) {
        handleLike();
      }
      setShowHeart(true);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single tap after delay → play/pause
      setTimeout(() => {
        if (lastTapRef.current === now) {
          togglePlay();
        }
      }, 300);
    }
  }, [liked, togglePlay]);

  async function handleLike() {
    if (!isAuthenticated()) return;

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));

    try {
      if (wasLiked) {
        await apiDelete(`/videos/${video.id}/like`, accessToken!);
      } else {
        await apiPost(`/videos/${video.id}/like`, {}, accessToken!);
      }
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    }
  }

  const videoSrc = video.videoUrl.startsWith("http")
    ? video.videoUrl
    : `${API_BASE}${video.videoUrl}`;

  return (
    <div className="relative h-full w-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="h-full w-full object-cover"
        playsInline
        loop
        muted={!isActive}
        preload="metadata"
        onClick={handleTap}
      />

      {/* Play/Pause indicator */}
      {!isPlaying && isActive && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/30 p-4">
            <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Heart animation */}
      <HeartAnimation show={showHeart} onComplete={() => setShowHeart(false)} />

      {/* Right side action bar */}
      <div className="absolute bottom-32 right-3 flex flex-col items-center gap-5 z-20">
        {/* User avatar */}
        <Link href={`/sellers/${video.user.id}`} className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-primary text-sm font-bold text-white">
            {video.user.avatarUrl ? (
              <img
                src={video.user.avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              video.user.firstName[0]
            )}
          </div>
        </Link>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center">
          <svg
            viewBox="0 0 24 24"
            className={`h-8 w-8 ${liked ? "fill-red-500 text-red-500" : "fill-white text-white"}`}
            stroke="currentColor"
            strokeWidth={liked ? 0 : 1}
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
          <span className="mt-1 text-xs font-semibold text-white">{likeCount}</span>
        </button>

        {/* Comments */}
        <div className="flex flex-col items-center">
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <span className="mt-1 text-xs font-semibold text-white">{video.commentCount}</span>
        </div>

        {/* Share */}
        <button className="flex flex-col items-center">
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          <span className="mt-1 text-xs font-semibold text-white">Share</span>
        </button>
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-14 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-6">
        {/* Username */}
        <p className="text-sm font-bold text-white">
          @{video.user.firstName.toLowerCase()}{video.user.lastName.toLowerCase()}
        </p>

        {/* Caption */}
        <p
          className={`mt-1 text-sm text-white/90 ${expanded ? "" : "line-clamp-2"}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {video.caption}
        </p>

        {/* Listing pill (if marketplace video) */}
        {video.listing && (
          <Link
            href={`/listings/${video.listing.slug}`}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0V7.875A2.625 2.625 0 015.625 5.25h12.75A2.625 2.625 0 0121 7.875v1.474" />
            </svg>
            <span className="text-xs font-medium text-white">
              {video.listing.title.slice(0, 30)}{video.listing.title.length > 30 ? "..." : ""}
            </span>
            <span className="text-xs font-bold text-primary-foreground">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
                maximumFractionDigits: 0,
              }).format(Number(video.listing.price))}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
