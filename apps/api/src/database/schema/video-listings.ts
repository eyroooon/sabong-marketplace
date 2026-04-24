import {
  pgTable,
  uuid,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { videos } from "./videos";
import { listings } from "./listings";

/**
 * Many-to-many: creators tag their listings inside their videos.
 * This powers Shoppable Reels — viewers see a 🛒 pill on videos with
 * tagged listings, tap to open a sheet with the tagged products.
 *
 * Business rules (enforced at service layer):
 *  - Only the video owner can tag; only their own listings can be tagged.
 *  - Max 5 tagged listings per video (practical limit for the shop sheet UI).
 *  - displayOrder determines rendering order in the shop sheet.
 *  - clickCount is incremented each time a viewer opens the sheet / taps a
 *    tagged listing; used for creator commerce analytics.
 */
export const videoListings = pgTable(
  "video_listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").default(0).notNull(),
    clickCount: integer("click_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_video_listings_unique").on(
      table.videoId,
      table.listingId,
    ),
    index("idx_video_listings_video").on(table.videoId),
    index("idx_video_listings_listing").on(table.listingId),
  ],
);
