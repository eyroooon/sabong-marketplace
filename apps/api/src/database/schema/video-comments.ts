import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { videos } from "./videos";

/**
 * Comments on videos. Threaded via parentId (null = top-level, uuid = reply).
 */
export const videoComments = pgTable(
  "video_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references(
      (): AnyPgColumn => videoComments.id,
      { onDelete: "cascade" },
    ),
    content: text("content").notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_video_comments_video").on(table.videoId),
    index("idx_video_comments_user").on(table.userId),
    index("idx_video_comments_parent").on(table.parentId),
    index("idx_video_comments_created").on(table.createdAt),
  ],
);
