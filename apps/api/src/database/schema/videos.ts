import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { listings } from "./listings";

export const videos = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),
    type: varchar("type", { length: 20 }).notNull(), // "marketplace" | "community"
    caption: text("caption").notNull(),
    videoUrl: varchar("video_url", { length: 500 }).notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    durationSeconds: integer("duration_seconds"),
    fileSizeBytes: integer("file_size_bytes"),
    mimeType: varchar("mime_type", { length: 50 }),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    shareCount: integer("share_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_videos_user").on(table.userId),
    index("idx_videos_type").on(table.type),
    index("idx_videos_status").on(table.status),
    index("idx_videos_listing").on(table.listingId),
    index("idx_videos_created").on(table.createdAt),
  ],
);

export const videoLikes = pgTable(
  "video_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_video_likes_unique").on(table.userId, table.videoId),
    index("idx_video_likes_user").on(table.userId),
    index("idx_video_likes_video").on(table.videoId),
  ],
);
