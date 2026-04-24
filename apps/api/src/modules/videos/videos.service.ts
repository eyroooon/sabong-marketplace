import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { eq, and, desc, sql, lt } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  videos,
  videoLikes,
  videoComments,
  users,
  listings,
  sellerProfiles,
  videoListings,
} from "../../database/schema";
import { inArray, asc } from "drizzle-orm";
import { CreateVideoDto } from "./dto/create-video.dto";
import { FeedQueryDto } from "./dto/feed-query.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { StorageService } from "../../common/storage/storage.service";
import { SellersService } from "../sellers/sellers.service";
import { NotificationsService } from "../notifications/notifications.service";

export interface CommentUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CommentNode {
  id: string;
  videoId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  createdAt: Date;
  user: CommentUser;
  replies: CommentNode[];
}

@Injectable()
export class VideosService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private storageService: StorageService,
    private sellersService: SellersService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    dto: CreateVideoDto,
    file: Express.Multer.File,
  ) {
    // Enforce plan's monthly video limit for sellers.
    // Non-sellers (regular users posting community videos) are not limited
    // by seller plans — checkVideoLimit throws NotFoundException for them
    // which we catch and ignore.
    try {
      await this.sellersService.checkVideoLimit(userId);
    } catch (err: any) {
      // Only swallow "no seller profile" — re-throw real limit violations
      if (err?.status !== 404) {
        throw err;
      }
    }

    // If marketplace type, validate listing ownership
    if (dto.type === "marketplace" && dto.listingId) {
      const [listing] = await this.db
        .select()
        .from(listings)
        .where(eq(listings.id, dto.listingId))
        .limit(1);

      if (!listing) {
        throw new NotFoundException("Listing not found");
      }

      // Verify user owns this listing via seller profile
      const [seller] = await this.db
        .select()
        .from(sellerProfiles)
        .where(
          and(
            eq(sellerProfiles.id, listing.sellerId),
            eq(sellerProfiles.userId, userId),
          ),
        )
        .limit(1);

      if (!seller) {
        throw new ForbiddenException(
          "You can only create marketplace videos for your own listings",
        );
      }
    }

    const videoUrl = await this.storageService.uploadFile(file, "videos");

    const [video] = await this.db
      .insert(videos)
      .values({
        userId,
        listingId: dto.type === "marketplace" ? dto.listingId : null,
        type: dto.type,
        caption: dto.caption,
        videoUrl,
        fileSizeBytes: file.size,
        mimeType: file.mimetype,
        status: "active",
      })
      .returning();

    return video;
  }

  async getFeed(query: FeedQueryDto, userId?: string) {
    const limit = query.limit || 10;
    const conditions: any[] = [eq(videos.status, "active")];

    if (query.type) {
      conditions.push(eq(videos.type, query.type));
    }

    if (query.cursor) {
      conditions.push(lt(videos.createdAt, new Date(query.cursor)));
    }

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const data = await this.db
      .select({
        id: videos.id,
        userId: videos.userId,
        type: videos.type,
        caption: videos.caption,
        videoUrl: videos.videoUrl,
        thumbnailUrl: videos.thumbnailUrl,
        viewCount: videos.viewCount,
        likeCount: videos.likeCount,
        commentCount: videos.commentCount,
        createdAt: videos.createdAt,
        listingId: videos.listingId,
        // User fields
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userAvatarUrl: users.avatarUrl,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(where)
      .orderBy(desc(videos.createdAt))
      .limit(limit);

    // Enrich with listing info and like status
    const enriched = await Promise.all(
      data.map(async (row: any) => {
        let listing = null;
        if (row.listingId) {
          const [l] = await this.db
            .select({
              id: listings.id,
              title: listings.title,
              slug: listings.slug,
              price: listings.price,
              breed: listings.breed,
              category: listings.category,
            })
            .from(listings)
            .where(eq(listings.id, row.listingId))
            .limit(1);
          listing = l || null;
        }

        let isLiked = false;
        if (userId) {
          const [like] = await this.db
            .select()
            .from(videoLikes)
            .where(
              and(
                eq(videoLikes.userId, userId),
                eq(videoLikes.videoId, row.id),
              ),
            )
            .limit(1);
          isLiked = !!like;
        }

        // How many listings are tagged in this reel (for 🛒 shop pill)
        const [tagCount] = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(videoListings)
          .where(eq(videoListings.videoId, row.id));
        const taggedListingCount = Number(tagCount?.count || 0);

        return {
          id: row.id,
          userId: row.userId,
          type: row.type,
          caption: row.caption,
          videoUrl: row.videoUrl,
          thumbnailUrl: row.thumbnailUrl,
          viewCount: row.viewCount,
          likeCount: row.likeCount,
          commentCount: row.commentCount,
          createdAt: row.createdAt,
          isLiked,
          taggedListingCount,
          user: {
            id: row.userId,
            firstName: row.userFirstName,
            lastName: row.userLastName,
            avatarUrl: row.userAvatarUrl,
          },
          listing,
        };
      }),
    );

    const nextCursor =
      enriched.length === limit
        ? enriched[enriched.length - 1].createdAt.toISOString()
        : null;

    return { data: enriched, nextCursor };
  }

  async findById(id: string, userId?: string) {
    const [video] = await this.db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.status, "active")))
      .limit(1);

    if (!video) {
      throw new NotFoundException("Video not found");
    }

    // Increment view count
    await this.db
      .update(videos)
      .set({ viewCount: sql`${videos.viewCount} + 1` })
      .where(eq(videos.id, id));

    // Get user info
    const [user] = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, video.userId))
      .limit(1);

    let isLiked = false;
    if (userId) {
      const [like] = await this.db
        .select()
        .from(videoLikes)
        .where(
          and(eq(videoLikes.userId, userId), eq(videoLikes.videoId, id)),
        )
        .limit(1);
      isLiked = !!like;
    }

    return { ...video, user, isLiked };
  }

  async like(userId: string, videoId: string) {
    // Verify video exists
    const [video] = await this.db
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);

    if (!video) {
      throw new NotFoundException("Video not found");
    }

    try {
      await this.db.insert(videoLikes).values({ userId, videoId });
    } catch (err: any) {
      if (err?.code === "23505") {
        throw new ConflictException("Already liked");
      }
      throw err;
    }

    await this.db
      .update(videos)
      .set({
        likeCount: sql`${videos.likeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, videoId));

    return { message: "Liked" };
  }

  async unlike(userId: string, videoId: string) {
    const result = await this.db
      .delete(videoLikes)
      .where(
        and(eq(videoLikes.userId, userId), eq(videoLikes.videoId, videoId)),
      )
      .returning();

    if (result.length > 0) {
      await this.db
        .update(videos)
        .set({
          likeCount: sql`GREATEST(${videos.likeCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(videos.id, videoId));
    }

    return { message: "Unliked" };
  }

  async remove(videoId: string, userId: string) {
    const [video] = await this.db
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);

    if (!video) {
      throw new NotFoundException("Video not found");
    }

    if (video.userId !== userId) {
      throw new ForbiddenException("You can only delete your own videos");
    }

    await this.db.delete(videos).where(eq(videos.id, videoId));

    // Delete file from storage (R2 or local disk)
    await this.storageService.delete(video.videoUrl);

    return { message: "Video deleted" };
  }

  // -------------------- Comments --------------------

  async listComments(videoId: string) {
    const rows = await this.db
      .select({
        id: videoComments.id,
        videoId: videoComments.videoId,
        userId: videoComments.userId,
        parentId: videoComments.parentId,
        content: videoComments.content,
        likeCount: videoComments.likeCount,
        createdAt: videoComments.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userDisplayName: users.displayName,
        userAvatarUrl: users.avatarUrl,
      })
      .from(videoComments)
      .innerJoin(users, eq(videoComments.userId, users.id))
      .where(eq(videoComments.videoId, videoId))
      .orderBy(desc(videoComments.createdAt));

    type Row = (typeof rows)[number];

    const byId = new Map<string, CommentNode>();
    rows.forEach((r: Row) => {
      byId.set(r.id, {
        id: r.id,
        videoId: r.videoId,
        parentId: r.parentId,
        content: r.content,
        likeCount: r.likeCount,
        createdAt: r.createdAt,
        user: {
          id: r.userId,
          firstName: r.userFirstName,
          lastName: r.userLastName,
          displayName: r.userDisplayName,
          avatarUrl: r.userAvatarUrl,
        },
        replies: [],
      });
    });

    const roots: CommentNode[] = [];
    byId.forEach((c) => {
      if (c.parentId) {
        const parent = byId.get(c.parentId);
        if (parent) {
          parent.replies.unshift(c); // chronological asc for replies
        } else {
          roots.push(c); // orphan (parent deleted) — surface as top-level
        }
      } else {
        roots.push(c);
      }
    });

    return { data: roots };
  }

  async createComment(
    videoId: string,
    userId: string,
    dto: CreateCommentDto,
  ) {
    const [video] = await this.db
      .select({ id: videos.id, userId: videos.userId, caption: videos.caption })
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.status, "active")))
      .limit(1);

    if (!video) throw new NotFoundException("Video not found");

    if (dto.parentId) {
      const [parent] = await this.db
        .select({ id: videoComments.id, userId: videoComments.userId })
        .from(videoComments)
        .where(
          and(
            eq(videoComments.id, dto.parentId),
            eq(videoComments.videoId, videoId),
          ),
        )
        .limit(1);
      if (!parent) throw new NotFoundException("Parent comment not found");
    }

    const [comment] = await this.db
      .insert(videoComments)
      .values({
        videoId,
        userId,
        parentId: dto.parentId ?? null,
        content: dto.content,
      })
      .returning();

    await this.db
      .update(videos)
      .set({ commentCount: sql`${videos.commentCount} + 1` })
      .where(eq(videos.id, videoId));

    // Notify video owner (skip if commenter IS the owner)
    if (video.userId !== userId) {
      const [commenter] = await this.db
        .select({
          firstName: users.firstName,
          displayName: users.displayName,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const commenterName =
        commenter?.displayName || commenter?.firstName || "Someone";
      await this.notificationsService.create({
        userId: video.userId,
        type: "video_comment",
        title: "New comment",
        body: `${commenterName} commented: "${dto.content.slice(0, 80)}"`,
        data: { videoId, commentId: comment.id },
      });
    }

    const [withUser] = await this.db
      .select({
        id: videoComments.id,
        content: videoComments.content,
        parentId: videoComments.parentId,
        likeCount: videoComments.likeCount,
        createdAt: videoComments.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userDisplayName: users.displayName,
        userAvatarUrl: users.avatarUrl,
      })
      .from(videoComments)
      .innerJoin(users, eq(videoComments.userId, users.id))
      .where(eq(videoComments.id, comment.id))
      .limit(1);

    return {
      id: withUser.id,
      content: withUser.content,
      parentId: withUser.parentId,
      likeCount: withUser.likeCount,
      createdAt: withUser.createdAt,
      user: {
        id: userId,
        firstName: withUser.userFirstName,
        lastName: withUser.userLastName,
        displayName: withUser.userDisplayName,
        avatarUrl: withUser.userAvatarUrl,
      },
      replies: [],
    };
  }

  async deleteComment(commentId: string, userId: string) {
    const [comment] = await this.db
      .select({
        id: videoComments.id,
        videoId: videoComments.videoId,
        userId: videoComments.userId,
      })
      .from(videoComments)
      .where(eq(videoComments.id, commentId))
      .limit(1);

    if (!comment) throw new NotFoundException("Comment not found");
    if (comment.userId !== userId) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    await this.db.delete(videoComments).where(eq(videoComments.id, commentId));

    // Decrement count (best effort — race-safe via GREATEST)
    await this.db
      .update(videos)
      .set({ commentCount: sql`GREATEST(${videos.commentCount} - 1, 0)` })
      .where(eq(videos.id, comment.videoId));

    return { message: "Comment deleted" };
  }

  async share(videoId: string) {
    const [video] = await this.db
      .select({ id: videos.id })
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.status, "active")))
      .limit(1);
    if (!video) throw new NotFoundException("Video not found");

    await this.db
      .update(videos)
      .set({ shareCount: sql`${videos.shareCount} + 1` })
      .where(eq(videos.id, videoId));

    return { message: "Shared" };
  }

  // ──────────────────────────────────────────────────────────────
  // Shoppable reels — tag listings in videos so viewers can buy.
  // ──────────────────────────────────────────────────────────────

  /**
   * Replace all tagged listings on a video with the provided set.
   * Only the video owner can tag. Only their OWN listings may be tagged.
   * Max 5 tagged listings per video.
   */
  async tagListings(
    videoId: string,
    userId: string,
    listingIds: string[],
  ) {
    if (listingIds.length > 5) {
      throw new BadRequestException("Max 5 tagged listings per video");
    }

    const [video] = await this.db
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);
    if (!video) throw new NotFoundException("Video not found");
    if (video.userId !== userId) {
      throw new ForbiddenException("Only the creator can tag listings");
    }

    if (listingIds.length > 0) {
      // Look up the seller profile for this user
      const [seller] = await this.db
        .select({ id: sellerProfiles.id })
        .from(sellerProfiles)
        .where(eq(sellerProfiles.userId, userId))
        .limit(1);
      if (!seller) {
        throw new ForbiddenException(
          "You need a seller profile to tag listings",
        );
      }

      const ownedListings = await this.db
        .select({ id: listings.id })
        .from(listings)
        .where(
          and(
            inArray(listings.id, listingIds),
            eq(listings.sellerId, seller.id),
          ),
        );

      if (ownedListings.length !== listingIds.length) {
        throw new ForbiddenException(
          "Can only tag listings you own as a seller",
        );
      }
    }

    // Clear existing tags then re-insert in the requested order
    await this.db
      .delete(videoListings)
      .where(eq(videoListings.videoId, videoId));

    if (listingIds.length > 0) {
      await this.db.insert(videoListings).values(
        listingIds.map((lid, i) => ({
          videoId,
          listingId: lid,
          displayOrder: i,
        })),
      );
    }

    return { tagged: listingIds.length };
  }

  /**
   * Get the list of tagged listings for a video, ordered by displayOrder.
   * Returns enriched listing info ready for the shop sheet UI.
   */
  async getTaggedListings(videoId: string) {
    const rows = await this.db
      .select({
        videoListing: videoListings,
        listing: listings,
      })
      .from(videoListings)
      .innerJoin(listings, eq(listings.id, videoListings.listingId))
      .where(eq(videoListings.videoId, videoId))
      .orderBy(asc(videoListings.displayOrder));

    return rows.map((r: any) => ({
      id: r.listing.id,
      slug: r.listing.slug,
      title: r.listing.title,
      breed: r.listing.breed,
      price: r.listing.price,
      primaryImageUrl: r.listing.primaryImageUrl,
      status: r.listing.status,
      displayOrder: r.videoListing.displayOrder,
      clickCount: r.videoListing.clickCount,
    }));
  }

  /**
   * Increment the click counter when a viewer taps a tagged listing
   * from the video shop sheet. Used for creator commerce analytics.
   */
  async trackShopClick(videoId: string, listingId: string) {
    await this.db
      .update(videoListings)
      .set({ clickCount: sql`${videoListings.clickCount} + 1` })
      .where(
        and(
          eq(videoListings.videoId, videoId),
          eq(videoListings.listingId, listingId),
        ),
      );
    return { ok: true };
  }
}
