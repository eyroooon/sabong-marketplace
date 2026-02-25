import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  nameFil: varchar("name_fil", { length: 50 }),
  slug: varchar("slug", { length: 50 }).unique().notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const breeds = pgTable("breeds", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  description: text("description"),
  origin: varchar("origin", { length: 100 }),
  characteristics: text("characteristics"),
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
});

export const bloodlines = pgTable("bloodlines", {
  id: serial("id").primaryKey(),
  breedId: integer("breed_id").references(() => breeds.id),
  name: varchar("name", { length: 200 }).notNull(),
  breeder: varchar("breeder", { length: 200 }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
});
