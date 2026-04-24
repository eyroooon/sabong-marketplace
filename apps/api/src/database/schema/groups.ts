import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Bloodline Groups — Facebook-style communities for sabungeros.
 *
 * Categories:
 *  - regional:  Pampanga Sabungeros, Batangueño Breeders, Cebu Sabong
 *  - bloodline: Kelso Nation, Sweater Society, Hatch Pride
 *  - topic:     Feeding & Nutrition, Vaccination Tips, Training
 *  - general:   anything else
 *
 * Types:
 *  - public:  anyone can view + join
 *  - private: anyone can view, membership requires approval
 *  - secret:  invisible unless member
 *
 * Counts (memberCount, postCount) are denormalized and maintained by
 * triggers from the group service.
 */
export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 20 }).notNull(), // regional | bloodline | topic | general
    type: varchar("type", { length: 12 }).notNull().default("public"), // public | private | secret
    iconEmoji: varchar("icon_emoji", { length: 8 }),
    coverImageUrl: text("cover_image_url"),
    memberCount: integer("member_count").notNull().default(0),
    postCount: integer("post_count").notNull().default(0),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_groups_slug_unique").on(table.slug),
    index("idx_groups_category").on(table.category),
    index("idx_groups_type").on(table.type),
    index("idx_groups_created_by").on(table.createdById),
  ],
);

/**
 * Group membership.
 *
 * Roles:
 *  - owner:     creator, full admin, cannot be removed
 *  - admin:     can post, moderate, invite, edit settings
 *  - moderator: can moderate posts + members
 *  - member:    regular member — can post, comment, react
 *
 * Status:
 *  - active:  currently a member
 *  - pending: request to join (for private groups)
 *  - banned:  removed by admin, cannot rejoin
 */
export const groupMembers = pgTable(
  "group_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 12 }).notNull().default("member"), // owner | admin | moderator | member
    status: varchar("status", { length: 10 }).notNull().default("active"), // active | pending | banned
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_group_members_unique").on(table.groupId, table.userId),
    index("idx_group_members_group").on(table.groupId),
    index("idx_group_members_user").on(table.userId),
    index("idx_group_members_status").on(table.status),
  ],
);

/**
 * Group posts — text + optional images. Group-scoped feed.
 *
 * Pinned posts appear at top of the group feed.
 * Images are stored as jsonb array of URLs.
 */
export const groupPosts = pgTable(
  "group_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    images: jsonb("images").$type<string[]>().default([]),
    likesCount: integer("likes_count").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_group_posts_group").on(table.groupId),
    index("idx_group_posts_author").on(table.authorId),
    index("idx_group_posts_created_at").on(table.createdAt),
    index("idx_group_posts_pinned_at").on(table.pinnedAt),
  ],
);

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type GroupPost = typeof groupPosts.$inferSelect;
export type NewGroupPost = typeof groupPosts.$inferInsert;
