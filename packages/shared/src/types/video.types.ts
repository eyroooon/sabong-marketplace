export type VideoType = "marketplace" | "community";
export type VideoStatus = "processing" | "active" | "removed";

export interface Video {
  id: string;
  userId: string;
  listingId: string | null;
  type: VideoType;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  status: VideoStatus;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoCardUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface VideoCardListing {
  id: string;
  title: string;
  slug: string;
  price: number;
  breed: string | null;
  category: string;
}

export interface VideoCard {
  id: string;
  userId: string;
  type: VideoType;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked?: boolean;
  user: VideoCardUser;
  listing: VideoCardListing | null;
}

export interface VideoFeedResponse {
  data: VideoCard[];
  nextCursor: string | null;
}
