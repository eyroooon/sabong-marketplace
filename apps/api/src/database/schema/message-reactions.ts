import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { messages } from "./messages";

/**
 * Emoji reactions on messages. One row per (message, user, emoji).
 * Toggling a reaction inserts or deletes a row.
 */
export const messageReactions = pgTable(
  "message_reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: varchar("emoji", { length: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_message_reactions_unique").on(
      table.messageId,
      table.userId,
      table.emoji,
    ),
    index("idx_message_reactions_message").on(table.messageId),
  ],
);
