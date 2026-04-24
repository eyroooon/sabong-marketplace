import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { eq, and, or, sql, inArray, desc } from "drizzle-orm";
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

  /**
   * Search users by name, displayName, or phone.
   * Excludes the querying user.
   * Used for friend/messaging discovery UI.
   */
  async searchUsers(query: string, currentUserId: string, limit = 20) {
    if (!query || query.trim().length < 2) return [];
    const pattern = `%${query.trim()}%`;
    const rows = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        city: users.city,
        province: users.province,
        isVerified: users.isVerified,
        followersCount: users.followersCount,
      })
      .from(users)
      .where(
        and(
          sql`${users.id} != ${currentUserId}`,
          eq(users.isActive, true),
          or(
            sql`${users.firstName} ILIKE ${pattern}`,
            sql`${users.lastName} ILIKE ${pattern}`,
            sql`${users.displayName} ILIKE ${pattern}`,
            sql`${users.phone} ILIKE ${pattern}`,
          ),
        ),
      )
      .orderBy(desc(users.followersCount))
      .limit(limit);
    return rows;
  }

  /**
   * Suggest people the current user might want to friend.
   * Tier 1: same province, not already in any friendship row.
   * Tier 2 (fallback): verified/popular users anywhere.
   * Ordered by followersCount.
   */
  async suggestFriends(currentUserId: string, limit = 10) {
    const [me] = await this.db
      .select({ province: users.province })
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);
    if (!me) return [];

    const baseSelect = {
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      city: users.city,
      province: users.province,
      isVerified: users.isVerified,
      followersCount: users.followersCount,
    } as const;

    const notFriendsYet = sql`NOT EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_a_id = ${currentUserId} AND f.user_b_id = ${users.id})
         OR (f.user_b_id = ${currentUserId} AND f.user_a_id = ${users.id})
    )`;

    let sameProvince: any[] = [];
    if (me.province) {
      sameProvince = await this.db
        .select(baseSelect)
        .from(users)
        .where(
          and(
            sql`${users.id} != ${currentUserId}`,
            eq(users.isActive, true),
            eq(users.province, me.province),
            notFriendsYet,
          ),
        )
        .orderBy(desc(users.followersCount))
        .limit(limit);
    }

    if (sameProvince.length >= limit) return sameProvince;

    // Tier 2 fallback: verified or popular users from any province
    const remaining = limit - sameProvince.length;
    const existingIds = sameProvince.map((u: any) => u.id);
    const fallback = await this.db
      .select(baseSelect)
      .from(users)
      .where(
        and(
          sql`${users.id} != ${currentUserId}`,
          eq(users.isActive, true),
          existingIds.length > 0
            ? sql`${users.id} NOT IN (${sql.join(
                existingIds.map((id: string) => sql`${id}`),
                sql`, `,
              )})`
            : sql`TRUE`,
          notFriendsYet,
        ),
      )
      .orderBy(desc(users.isVerified), desc(users.followersCount))
      .limit(remaining);

    return [...sameProvince, ...fallback];
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
