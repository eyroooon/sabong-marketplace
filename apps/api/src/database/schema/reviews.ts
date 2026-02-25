import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { sellerProfiles } from "./sellers";
import { listings } from "./listings";
import { orders } from "./orders";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .unique()
      .notNull()
      .references(() => orders.id),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellerProfiles.id),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id),

    rating: integer("rating").notNull(),
    title: varchar("title", { length: 200 }),
    comment: text("comment"),

    accuracyRating: integer("accuracy_rating"),
    communicationRating: integer("communication_rating"),
    shippingRating: integer("shipping_rating"),

    sellerResponse: text("seller_response"),
    sellerRespondedAt: timestamp("seller_responded_at", { withTimezone: true }),

    isVisible: boolean("is_visible").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_reviews_seller").on(table.sellerId),
    index("idx_reviews_listing").on(table.listingId),
    index("idx_reviews_rating").on(table.rating),
    check("rating_check", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
  ],
);
