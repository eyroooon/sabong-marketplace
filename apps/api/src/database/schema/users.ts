import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique(),
    phone: varchar("phone", { length: 20 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 100 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    role: varchar("role", { length: 20 }).default("buyer").notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    phoneVerified: boolean("phone_verified").default(false).notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),

    // Address
    region: varchar("region", { length: 100 }),
    province: varchar("province", { length: 100 }),
    city: varchar("city", { length: 100 }),
    barangay: varchar("barangay", { length: 100 }),
    addressLine: varchar("address_line", { length: 255 }),
    zipCode: varchar("zip_code", { length: 10 }),

    // Preferences
    language: varchar("language", { length: 5 }).default("fil").notNull(),
    notificationPrefs: jsonb("notification_prefs")
      .default({ sms: true, push: true, email: false })
      .notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_users_phone").on(table.phone),
    index("idx_users_email").on(table.email),
    index("idx_users_role").on(table.role),
  ],
);
