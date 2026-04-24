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
import { sql } from "drizzle-orm";
import { users } from "./users";
import { listings } from "./listings";

/**
 * Polymorphic chat model.
 *
 * type: 'listing' — legacy buyer/seller chat scoped to a listing
 *       'dm'       — 1:1 direct message between any two users
 *       'group'    — group chat with N participants via chat_participants
 *
 * Legacy listing chats keep buyer_id/seller_id/listing_id for backward compat.
 * New DMs and groups: those columns are NULL; participants live in chat_participants.
 */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Chat type discriminator
    type: varchar("type", { length: 20 }).default("listing").notNull(),

    // Group metadata (null for DMs and listing chats)
    title: varchar("title", { length: 100 }),
    avatarUrl: text("avatar_url"),

    // Legacy listing-scoped fields (nullable for DMs/groups)
    listingId: uuid("listing_id").references(() => listings.id),
    buyerId: uuid("buyer_id").references(() => users.id),
    sellerId: uuid("seller_id").references(() => users.id),

    createdById: uuid("created_by_id").references(() => users.id),

    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessagePreview: varchar("last_message_preview", { length: 200 }),

    // Legacy unread counters — kept for listing chats backward compat
    buyerUnreadCount: integer("buyer_unread_count").default(0).notNull(),
    sellerUnreadCount: integer("seller_unread_count").default(0).notNull(),

    isArchivedBuyer: boolean("is_archived_buyer").default(false).notNull(),
    isArchivedSeller: boolean("is_archived_seller").default(false).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_conversations_type").on(table.type),
    index("idx_conversations_buyer").on(table.buyerId),
    index("idx_conversations_seller").on(table.sellerId),
    index("idx_conversations_last_message").on(table.lastMessageAt),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),

    content: text("content").notNull(),
    messageType: varchar("message_type", { length: 20 })
      .default("text")
      .notNull(),
    // 'text' | 'image' | 'video' | 'voice' | 'offer'
    // | 'listing_share' | 'reel_share' | 'system'

    // Rich media fields (null for plain text messages)
    mediaUrl: text("media_url"),
    mediaDurationMs: integer("media_duration_ms"),
    mediaWidth: integer("media_width"),
    mediaHeight: integer("media_height"),

    // Reply threading (references another message in the same conversation)
    replyToMessageId: uuid("reply_to_message_id"),

    // Attached objects for rich share messages
    attachedListingId: uuid("attached_listing_id").references(() => listings.id),
    attachedVideoId: uuid("attached_video_id"),

    // Legacy offer fields preserved
    offerAmount: decimal("offer_amount", { precision: 10, scale: 2 }),
    offerStatus: varchar("offer_status", { length: 20 }),

    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),

    // Soft-delete support
    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_messages_conversation").on(
      table.conversationId,
      table.createdAt,
    ),
    index("idx_messages_sender").on(table.senderId),
    index("idx_messages_reply_to").on(table.replyToMessageId),
  ],
);
