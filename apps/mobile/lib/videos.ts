/**
 * Videos + comments + follows data layer — react-query hooks wrapping
 * the NestJS /videos + /users/:id/follow endpoints.
 */
import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "./api";

export interface VideoCreator {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  avatarUrl: string | null;
}

export interface VideoListing {
  id: string;
  title: string;
  slug: string;
  price: string;
  breed: string | null;
  category: string;
}

export interface Video {
  id: string;
  userId: string;
  type: "marketplace" | "community";
  caption: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  isLiked?: boolean;
  taggedListingCount?: number;
  user: VideoCreator;
  listing: VideoListing | null;
}

/** A listing that a creator tagged in a reel (shoppable reels). */
export interface TaggedListing {
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

export interface CommentUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface VideoComment {
  id: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  createdAt: string;
  user: CommentUser;
  replies: VideoComment[];
}

/** Infinite scroll feed — matches /videos?type=…&cursor=… */
export function useVideoFeed(type?: "marketplace" | "community") {
  return useInfiniteQuery<{ data: Video[]; nextCursor: string | null }>({
    queryKey: ["videos", type ?? "all"],
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (pageParam) params.set("cursor", pageParam as string);
      params.set("limit", "10");
      return apiGet<{ data: Video[]; nextCursor: string | null }>(
        `/videos?${params.toString()}`,
      );
    },
  });
}

export function useLikeVideo(videoId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, { like: boolean }>({
    mutationFn: async ({ like }) => {
      if (like) {
        await apiPost(`/videos/${videoId}/like`, {});
      } else {
        await apiDelete(`/videos/${videoId}/like`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useShareVideo(videoId: string) {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiPost(`/videos/${videoId}/share`, {});
    },
  });
}

/** Comments — threaded via parentId. */
export function useVideoComments(videoId: string | null) {
  return useQuery<{ data: VideoComment[] }, Error>({
    queryKey: ["video-comments", videoId],
    enabled: !!videoId,
    queryFn: () =>
      apiGet<{ data: VideoComment[] }>(`/videos/${videoId}/comments`),
  });
}

export function useCreateComment(videoId: string) {
  const qc = useQueryClient();
  return useMutation<
    VideoComment,
    Error,
    { content: string; parentId?: string }
  >({
    mutationFn: (input) =>
      apiPost<VideoComment>(`/videos/${videoId}/comments`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video-comments", videoId] });
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useDeleteComment(videoId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (commentId) => {
      await apiDelete(`/videos/comments/${commentId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video-comments", videoId] });
    },
  });
}

/** Follows. */
export function useFollowStatus(targetUserId: string | null) {
  return useQuery<{ following: boolean }, Error>({
    queryKey: ["follow-status", targetUserId],
    enabled: !!targetUserId,
    queryFn: () =>
      apiGet<{ following: boolean }>(`/users/${targetUserId}/follow/status`),
  });
}

export function useFollow(targetUserId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, { follow: boolean }>({
    mutationFn: async ({ follow }) => {
      if (follow) {
        await apiPost(`/users/${targetUserId}/follow`, {});
      } else {
        await apiDelete(`/users/${targetUserId}/follow`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-status", targetUserId] });
    },
  });
}

export function formatVideoPrice(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "";
  return `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

/** Shoppable reels — fetch listings tagged in a video. */
export function useTaggedListings(videoId: string | null) {
  return useQuery<TaggedListing[], Error>({
    queryKey: ["tagged-listings", videoId],
    enabled: !!videoId,
    queryFn: () =>
      apiGet<TaggedListing[]>(`/videos/${videoId}/tagged-listings`),
    staleTime: 60_000,
  });
}

/** Fire-and-forget click tracker for creator commerce analytics. */
export async function trackShopClick(videoId: string, listingId: string) {
  try {
    await apiPost(`/videos/${videoId}/listings/${listingId}/click`, {});
  } catch {
    // analytics failures should never block navigation
  }
}
