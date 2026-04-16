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
  users,
  listings,
  sellerProfiles,
} from "../../database/schema";
import { CreateVideoDto } from "./dto/create-video.dto";
import { FeedQueryDto } from "./dto/feed-query.dto";
import { StorageService } from "../../common/storage/storage.service";
import { SellersService } from "../sellers/sellers.service";

@Injectable()
export class VideosService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private storageService: StorageService,
    private sellersService: SellersService,
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
}
