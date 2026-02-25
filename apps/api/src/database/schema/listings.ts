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
import { sellerProfiles } from "./sellers";

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellerProfiles.id, { onDelete: "cascade" }),

    // Basic Info
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    slug: varchar("slug", { length: 250 }).unique().notNull(),

    // Gamefowl Details
    category: varchar("category", { length: 50 }).notNull(),
    breed: varchar("breed", { length: 100 }),
    bloodline: varchar("bloodline", { length: 200 }),
    ageMonths: integer("age_months"),
    weightKg: decimal("weight_kg", { precision: 4, scale: 2 }),
    color: varchar("color", { length: 50 }),
    legColor: varchar("leg_color", { length: 50 }),
    fightingStyle: varchar("fighting_style", { length: 100 }),

    // Lineage
    sireInfo: varchar("sire_info", { length: 200 }),
    damInfo: varchar("dam_info", { length: 200 }),
    pedigreeUrl: varchar("pedigree_url", { length: 500 }),

    // Health
    vaccinationStatus: varchar("vaccination_status", { length: 50 }),
    healthCertUrl: varchar("health_cert_url", { length: 500 }),

    // Pricing
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    priceType: varchar("price_type", { length: 20 }).default("fixed").notNull(),
    minBid: decimal("min_bid", { precision: 10, scale: 2 }),

    // Status
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    featuredUntil: timestamp("featured_until", { withTimezone: true }),

    // Location
    locationProvince: varchar("location_province", { length: 100 }).notNull(),
    locationCity: varchar("location_city", { length: 100 }).notNull(),

    // Shipping
    shippingAvailable: boolean("shipping_available").default(false).notNull(),
    shippingAreas: varchar("shipping_areas", { length: 50 })
      .default("local")
      .notNull(),
    shippingFee: decimal("shipping_fee", { precision: 8, scale: 2 }),
    meetupAvailable: boolean("meetup_available").default(true).notNull(),

    // Stats
    viewCount: integer("view_count").default(0).notNull(),
    inquiryCount: integer("inquiry_count").default(0).notNull(),
    favoriteCount: integer("favorite_count").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_listings_seller").on(table.sellerId),
    index("idx_listings_status").on(table.status),
    index("idx_listings_category").on(table.category),
    index("idx_listings_breed").on(table.breed),
    index("idx_listings_price").on(table.price),
    index("idx_listings_province").on(table.locationProvince),
    index("idx_listings_featured").on(table.isFeatured, table.featuredUntil),
    index("idx_listings_created").on(table.createdAt),
  ],
);

export const listingImages = pgTable(
  "listing_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 500 }).notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    altText: varchar("alt_text", { length: 200 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_listing_images_listing").on(table.listingId)],
);
