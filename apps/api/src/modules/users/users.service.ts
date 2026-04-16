import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { eq, and, sql, inArray } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  users,
  listings,
  orders,
  notifications,
  favorites,
  sellerProfiles,
} from "../../database/schema";

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async findById(id: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        phone: users.phone,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        role: users.role,
        isVerified: users.isVerified,
        province: users.province,
        city: users.city,
        language: users.language,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateProfile(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      email?: string;
      region?: string;
      province?: string;
      city?: string;
      barangay?: string;
      addressLine?: string;
      zipCode?: string;
      language?: string;
    },
  ) {
    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException("User not found");
    }

    return {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      displayName: updated.displayName,
      email: updated.email,
      province: updated.province,
      city: updated.city,
    };
  }

  async getDashboardStats(userId: string) {
    // Get seller profile if exists
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId))
      .limit(1);

    // Active listings count (only if seller)
    let activeListings = 0;
    if (seller) {
      const [result] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(
          and(
            eq(listings.sellerId, seller.id),
            eq(listings.status, "active"),
          ),
        );
      activeListings = Number(result?.count || 0);
    }

    // Pending orders count (as buyer or seller)
    const pendingStatuses = [
      "pending",
      "payment_pending",
      "paid",
      "confirmed",
      "shipped",
    ];
    let orderCondition;
    if (seller) {
      orderCondition = and(
        sql`${orders.status} IN ('pending','payment_pending','paid','confirmed','shipped')`,
        sql`(${orders.buyerId} = ${userId} OR ${orders.sellerId} = ${seller.id})`,
      );
    } else {
      orderCondition = and(
        sql`${orders.status} IN ('pending','payment_pending','paid','confirmed','shipped')`,
        eq(orders.buyerId, userId),
      );
    }
    const [pendingResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(orderCondition);
    const pendingOrders = Number(pendingResult?.count || 0);

    // Unread notifications count
    const [notifResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      );
    const unreadNotifications = Number(notifResult?.count || 0);

    // Favorites count
    const [favResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    const favoritesCount = Number(favResult?.count || 0);

    return {
      activeListings,
      pendingOrders,
      unreadNotifications,
      favorites: favoritesCount,
      totalSales: seller ? seller.totalSales : null,
      avgRating: seller ? seller.avgRating : null,
    };
  }

  async getPublicProfile(id: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        province: users.province,
        city: users.city,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }
}
