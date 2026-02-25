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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { listings } from "./listings";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").references(() => listings.id),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id),

    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessagePreview: varchar("last_message_preview", { length: 200 }),

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
    uniqueIndex("idx_conversations_unique").on(
      table.listingId,
      table.buyerId,
      table.sellerId,
    ),
    index("idx_conversations_buyer").on(table.buyerId),
    index("idx_conversations_seller").on(table.sellerId),
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

    offerAmount: decimal("offer_amount", { precision: 10, scale: 2 }),
    offerStatus: varchar("offer_status", { length: 20 }),

    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),

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
  ],
);
