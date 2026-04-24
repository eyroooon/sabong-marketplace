"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { HeartAnimation } from "./heart-animation";
import { CommentPanel } from "./comment-panel";

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
    taggedListingCount?: number;
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

interface TaggedListing {
  id: string;
  slug: string;
  title: string;
  breed: string | null;
  price: string;
  primaryImageUrl: string | null;
  status: string;
  displayOrder: number;
  clickCount: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001";

export function VideoCard({ video, isActive }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { accessToken, isAuthenticated, user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(video.isLiked || false);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [commentCount, setCommentCount] = useState(video.commentCount);
  const [showHeart, setShowHeart] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [taggedListings, setTaggedListings] = useState<TaggedListing[]>([]);
  const [shopLoading, setShopLoading] = useState(false);

  const openShop = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShopOpen(true);
    if (taggedListings.length > 0) return; // already fetched
    setShopLoading(true);
    try {
      const data = await apiGet<TaggedListing[]>(
        `/videos/${video.id}/tagged-listings`,
      );
      setTaggedListings(data || []);
    } catch {
      setTaggedListings([]);
    } finally {
      setShopLoading(false);
    }
  }, [video.id, taggedListings.length]);

  const trackShopClick = useCallback((listingId: string) => {
    // Fire-and-forget — we don't need the response
    apiPost(
      `/videos/${video.id}/listings/${listingId}/click`,
      {},
      accessToken || undefined,
    ).catch(() => {});
  }, [video.id, accessToken]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [shareTip, setShareTip] = useState(false);
  const lastTapRef = useRef(0);
  const isOwnVideo = user?.id === video.user.id;

  // Check follow status when logged-in + not viewing own video
  useEffect(() => {
    if (!accessToken || isOwnVideo) return;
    let cancelled = false;
    apiGet<{ following: boolean }>(
      `/users/${video.user.id}/follow/status`,
      accessToken,
    )
      .then((res) => {
        if (!cancelled) setFollowing(!!res.following);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accessToken, video.user.id, isOwnVideo]);

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

  async function handleFollow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!accessToken || isOwnVideo || followBusy) return;
    setFollowBusy(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    try {
      if (wasFollowing) {
        await apiDelete(`/users/${video.user.id}/follow`, accessToken);
      } else {
        await apiPost(`/users/${video.user.id}/follow`, {}, accessToken);
      }
    } catch {
      setFollowing(wasFollowing);
    } finally {
      setFollowBusy(false);
    }
  }

  async function handleShare() {
    const shareUrl = `${window.location.origin}/feed?v=${video.id}`;
    // Fire-and-forget share count bump (endpoint is public)
    apiPost(`/videos/${video.id}/share`, {}).catch(() => {});
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.caption.slice(0, 60),
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareTip(true);
        setTimeout(() => setShareTip(false), 1600);
      }
    } catch {
      // share cancelled by user — ignore
    }
  }

  function openComments(e: React.MouseEvent) {
    e.stopPropagation();
    setCommentsOpen(true);
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

      {/* Shop pill — appears when the creator tagged listings in this reel */}
      {(video.taggedListingCount ?? 0) > 0 && (
        <button
          onClick={openShop}
          className="absolute left-1/2 top-16 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 px-4 py-2 text-xs font-bold text-white shadow-xl ring-2 ring-white/60 transition-transform hover:scale-105"
          aria-label={`Shop ${video.taggedListingCount} tagged listings`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          <span>🛒 {video.taggedListingCount}</span>
        </button>
      )}

      {/* Shop sheet */}
      {shopOpen && (
        <div
          className="absolute inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShopOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black">🛒 Shop this reel</h3>
              <button
                onClick={() => setShopOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {shopLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              </div>
            ) : taggedListings.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No listings tagged yet.
              </p>
            ) : (
              <div className="space-y-2">
                {taggedListings.map((l) => (
                  <Link
                    key={l.id}
                    href={`/listings/${l.slug}?ref=feed&v=${video.id}`}
                    onClick={() => trackShopClick(l.id)}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-amber-100 to-red-100">
                      {l.primaryImageUrl ? (
                        <img
                          src={
                            l.primaryImageUrl.startsWith("http")
                              ? l.primaryImageUrl
                              : `${API_BASE}${l.primaryImageUrl}`
                          }
                          alt={l.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          🐓
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {l.title}
                      </p>
                      {l.breed && (
                        <p className="text-xs text-gray-500">{l.breed}</p>
                      )}
                      <p className="mt-1 text-base font-black text-red-600">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                          maximumFractionDigits: 0,
                        }).format(Number(l.price))}
                      </p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-red-500 px-3 py-1.5 text-xs font-bold text-white">
                      Shop →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right side action bar */}
      <div className="absolute bottom-32 right-3 flex flex-col items-center gap-5 z-20">
        {/* User avatar + follow badge */}
        <div className="relative">
          <Link href={`/sellers/${video.user.id}`}>
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
          {isAuthenticated() && !isOwnVideo && !following && (
            <button
              onClick={handleFollow}
              disabled={followBusy}
              aria-label="Follow"
              className="absolute -bottom-1 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 disabled:opacity-60"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
          {isAuthenticated() && !isOwnVideo && following && (
            <button
              onClick={handleFollow}
              disabled={followBusy}
              aria-label="Unfollow"
              title="Following — tap to unfollow"
              className="absolute -bottom-1 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-white text-red-500 shadow hover:bg-gray-100 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
              </svg>
            </button>
          )}
        </div>

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
        <button
          onClick={openComments}
          className="flex flex-col items-center"
          aria-label="Open comments"
        >
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <span className="mt-1 text-xs font-semibold text-white">{commentCount}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="relative flex flex-col items-center"
          aria-label="Share"
        >
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          <span className="mt-1 text-xs font-semibold text-white">Share</span>
          {shareTip && (
            <span className="absolute -left-24 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-white/95 px-3 py-1 text-xs font-semibold text-gray-900 shadow">
              Link copied ✓
            </span>
          )}
        </button>
      </div>

      {/* Comment panel */}
      <CommentPanel
        videoId={video.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCountChange={setCommentCount}
      />

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

        {/* Shop This Bird CTA — appears on marketplace videos */}
        {video.listing && (
          <Link
            href={`/listings/${video.listing.slug}?ref=feed&v=${video.id}`}
            className="mt-2 inline-flex w-full max-w-sm items-center gap-3 rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur-md ring-1 ring-white/30 transition-transform hover:scale-[1.02] hover:bg-white/20 sm:w-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-red-500 text-white shadow">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                Shop This Bird
              </p>
              <p className="truncate text-xs font-semibold text-white">
                {video.listing.title}
              </p>
            </div>
            <span className="flex-shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-red-600">
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
