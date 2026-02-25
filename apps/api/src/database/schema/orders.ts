import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sellerProfiles } from "./sellers";
import { listings } from "./listings";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: varchar("order_number", { length: 20 }).unique().notNull(),

    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellerProfiles.id),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id),

    // Pricing
    itemPrice: decimal("item_price", { precision: 10, scale: 2 }).notNull(),
    shippingFee: decimal("shipping_fee", { precision: 8, scale: 2 })
      .default("0")
      .notNull(),
    platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),

    // Status
    status: varchar("status", { length: 30 }).default("pending").notNull(),

    // Delivery
    deliveryMethod: varchar("delivery_method", { length: 20 }),
    deliveryAddress: text("delivery_address"),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    shippingProvider: varchar("shipping_provider", { length: 50 }),

    // Dates
    paidAt: timestamp("paid_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

    // Escrow
    escrowStatus: varchar("escrow_status", { length: 20 })
      .default("none")
      .notNull(),
    escrowReleasedAt: timestamp("escrow_released_at", { withTimezone: true }),

    // Notes
    buyerNotes: text("buyer_notes"),
    sellerNotes: text("seller_notes"),
    cancelReason: text("cancel_reason"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_orders_buyer").on(table.buyerId),
    index("idx_orders_seller").on(table.sellerId),
    index("idx_orders_status").on(table.status),
    index("idx_orders_number").on(table.orderNumber),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),

    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
    method: varchar("method", { length: 30 }).notNull(),
    provider: varchar("provider", { length: 20 }).notNull(),

    providerPaymentId: varchar("provider_payment_id", { length: 200 }),
    providerCheckoutUrl: varchar("provider_checkout_url", { length: 500 }),

    status: varchar("status", { length: 20 }).default("pending").notNull(),
    providerResponse: text("provider_response"),

    paidAt: timestamp("paid_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_payments_order").on(table.orderId),
    index("idx_payments_status").on(table.status),
    index("idx_payments_provider").on(table.providerPaymentId),
  ],
);
