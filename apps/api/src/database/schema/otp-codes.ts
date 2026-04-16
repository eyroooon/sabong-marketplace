import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: varchar("phone", { length: 20 }).notNull(),
    // Stores a bcrypt hash of the 6-digit code (never plaintext)
    code: varchar("code", { length: 255 }).notNull(),
    purpose: varchar("purpose", { length: 20 }).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_otp_phone").on(table.phone),
    index("idx_otp_expires").on(table.expiresAt),
  ],
);
