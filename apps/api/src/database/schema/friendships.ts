import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Mutual friendship relationship (bidirectional).
 *
 * INVARIANT: Always insert with userAId < userBId (lexicographic UUID sort).
 * This guarantees a single row per pair regardless of who sent the request.
 * Use helper `canonicalPair(idA, idB)` before any insert.
 *
 * Status values:
 *  - pending: request sent, awaiting recipient's accept/decline
 *  - accepted: both users are friends
 *  - declined: request was declined (row kept to allow re-request later)
 *  - blocked: one user has blocked the other (requestedById marks the blocker)
 */
export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userAId: uuid("user_a_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userBId: uuid("user_b_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull(),
    requestedById: uuid("requested_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_friendships_unique_pair").on(table.userAId, table.userBId),
    index("idx_friendships_user_a").on(table.userAId),
    index("idx_friendships_user_b").on(table.userBId),
    index("idx_friendships_status").on(table.status),
  ],
);
