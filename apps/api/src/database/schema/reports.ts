import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { listings } from "./listings";
import { reviews } from "./reviews";

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id),

    reportType: varchar("report_type", { length: 20 }).notNull(),
    listingId: uuid("listing_id").references(() => listings.id),
    reportedUserId: uuid("reported_user_id").references(() => users.id),
    reviewId: uuid("review_id").references(() => reviews.id),

    reason: varchar("reason", { length: 50 }).notNull(),
    description: text("description"),
    evidenceUrls: jsonb("evidence_urls"),

    status: varchar("status", { length: 20 }).default("pending").notNull(),
    adminNotes: text("admin_notes"),
    resolvedBy: uuid("resolved_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_reports_status").on(table.status),
    index("idx_reports_type").on(table.reportType),
  ],
);
