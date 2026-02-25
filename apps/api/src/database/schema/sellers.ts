import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const sellerProfiles = pgTable(
  "seller_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .unique()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Business Info
    farmName: varchar("farm_name", { length: 200 }).notNull(),
    businessType: varchar("business_type", { length: 50 }),
    description: text("description"),

    // Verification
    verificationStatus: varchar("verification_status", { length: 20 })
      .default("pending")
      .notNull(),
    governmentIdUrl: varchar("government_id_url", { length: 500 }),
    farmPermitUrl: varchar("farm_permit_url", { length: 500 }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),

    // Seller Plan
    plan: varchar("plan", { length: 20 }).default("free").notNull(),
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),

    // Stats (denormalized)
    totalSales: integer("total_sales").default(0).notNull(),
    totalListings: integer("total_listings").default(0).notNull(),
    avgRating: decimal("avg_rating", { precision: 3, scale: 2 })
      .default("0.00")
      .notNull(),
    ratingCount: integer("rating_count").default(0).notNull(),
    responseRate: decimal("response_rate", { precision: 5, scale: 2 })
      .default("0.00")
      .notNull(),
    responseTime: integer("response_time").default(0).notNull(),

    // Location
    farmRegion: varchar("farm_region", { length: 100 }),
    farmProvince: varchar("farm_province", { length: 100 }),
    farmCity: varchar("farm_city", { length: 100 }),
    farmBarangay: varchar("farm_barangay", { length: 100 }),

    // Social
    facebookUrl: varchar("facebook_url", { length: 500 }),
    youtubeUrl: varchar("youtube_url", { length: 500 }),
    tiktokUrl: varchar("tiktok_url", { length: 500 }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_seller_profiles_user").on(table.userId),
    index("idx_seller_profiles_status").on(table.verificationStatus),
    index("idx_seller_profiles_rating").on(table.avgRating),
  ],
);
