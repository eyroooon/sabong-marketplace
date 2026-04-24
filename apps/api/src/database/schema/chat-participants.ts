import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { conversations } from "./messages";

/**
 * Polymorphic chat membership — one row per (conversation, user).
 *
 * role: 'owner' | 'admin' | 'member'
 * unread_count: denormalized count of unread messages for this user in this chat
 * last_read_at: timestamp of the most recent message they've read
 */
export const chatParticipants = pgTable(
  "chat_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("member").notNull(),
    unreadCount: integer("unread_count").default(0).notNull(),
    isMuted: boolean("is_muted").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_chat_participants_unique").on(
      table.conversationId,
      table.userId,
    ),
    index("idx_chat_participants_user").on(table.userId),
    index("idx_chat_participants_conversation").on(table.conversationId),
  ],
);
