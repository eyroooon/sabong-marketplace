import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { eq, desc, sql, and, gte, lt, isNotNull } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  users,
  listings,
  orders,
  reports,
  sellerProfiles,
} from "../../database/schema";

type TimeRange = "day" | "week" | "month" | "year";

@Injectable()
export class AdminService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async getDashboardStats() {
    const [userCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [sellerCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "seller"));

    const [listingCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(eq(listings.status, "active"));

    const [orderCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(orders);

    const [pendingReportCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(eq(reports.status, "pending"));

    return {
      totalUsers: Number(userCount.count),
      totalSellers: Number(sellerCount.count),
      activeListings: Number(listingCount.count),
      totalOrders: Number(orderCount.count),
      pendingReports: Number(pendingReportCount.count),
    };
  }

  async getUsers(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          isVerified: users.isVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: sql<number>`count(*)` }).from(users),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getListings(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;

    let query = this.db
      .select()
      .from(listings)
      .orderBy(desc(listings.createdAt))
      .limit(limit)
      .offset(offset);

    let countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(listings);

    if (status) {
      query = this.db
        .select()
        .from(listings)
        .where(eq(listings.status, status))
        .orderBy(desc(listings.createdAt))
        .limit(limit)
        .offset(offset);

      countQuery = this.db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(eq(listings.status, status));
    }

    const [data, countResult] = await Promise.all([query, countQuery]);
    const total = Number(countResult[0]?.count || 0);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getReports(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;

    let query = this.db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);

    let countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(reports);

    if (status) {
      query = this.db
        .select()
        .from(reports)
        .where(eq(reports.status, status))
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset);

      countQuery = this.db
        .select({ count: sql<number>`count(*)` })
        .from(reports)
        .where(eq(reports.status, status));
    }

    const [data, countResult] = await Promise.all([query, countQuery]);
    const total = Number(countResult[0]?.count || 0);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async resolveReport(
    reportId: string,
    adminId: string,
    notes: string,
    action?: string,
  ) {
    const [report] = await this.db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    // Update report status
    const [updated] = await this.db
      .update(reports)
      .set({
        status: "resolved",
        adminNotes: notes,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId))
      .returning();

    // Optionally take action on the reported entity
    if (action === "deactivate_listing" && report.listingId) {
      await this.db
        .update(listings)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(listings.id, report.listingId));
    }

    if (action === "deactivate_user" && report.reportedUserId) {
      await this.db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, report.reportedUserId));
    }

    return updated;
  }

  async toggleUserStatus(userId: string, isActive: boolean) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const [updated] = await this.db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return { id: updated.id, isActive: updated.isActive };
  }

  async toggleListingStatus(listingId: string, status: string) {
    const [listing] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!listing) {
      throw new NotFoundException("Listing not found");
    }

    const [updated] = await this.db
      .update(listings)
      .set({ status, updatedAt: new Date() })
      .where(eq(listings.id, listingId))
      .returning();

    return { id: updated.id, status: updated.status };
  }

  async getOrders(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: sql<number>`count(*)` }).from(orders),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /* --------------------------------------------------------------------- */
  /*  Analytics                                                            */
  /* --------------------------------------------------------------------- */

  async getAnalytics(timeRange: TimeRange = "month") {
    const now = new Date();
    const ranges: Record<TimeRange, Date> = {
      day: new Date(now.getTime() - 24 * 3600 * 1000),
      week: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 3600 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 3600 * 1000),
    };
    const startDate = ranges[timeRange];

    const [
      revenue,
      orderStats,
      userGrowth,
      listingStats,
      topBreeds,
      topProvinces,
      dailyRevenue,
    ] = await Promise.all([
      this.getRevenue(startDate),
      this.getOrderStats(startDate),
      this.getUserGrowth(startDate),
      this.getListingStats(startDate),
      this.getTopBreeds(startDate),
      this.getTopProvinces(startDate),
      this.getDailyRevenue(startDate),
    ]);

    return {
      timeRange,
      revenue,
      orders: orderStats,
      users: userGrowth,
      listings: listingStats,
      topBreeds,
      topProvinces,
      dailyRevenue,
    };
  }

  async getRevenue(since: Date) {
    // Previous period has the same length, immediately before `since`.
    const periodMs = Date.now() - since.getTime();
    const previousStart = new Date(since.getTime() - periodMs);

    const [current] = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${orders.platformFee}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, "completed"),
          gte(orders.createdAt, since),
        ),
      );

    const [previous] = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${orders.platformFee}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, "completed"),
          gte(orders.createdAt, previousStart),
          lt(orders.createdAt, since),
        ),
      );

    const total = Number(current?.total ?? 0);
    const previousPeriod = Number(previous?.total ?? 0);
    const percentChange =
      previousPeriod === 0
        ? total > 0
          ? 100
          : 0
        : ((total - previousPeriod) / previousPeriod) * 100;

    return {
      total,
      previousPeriod,
      percentChange: Math.round(percentChange * 10) / 10,
    };
  }

  async getOrderStats(since: Date) {
    const [row] = await this.db
      .select({
        total: sql<number>`COUNT(*)`,
        completed: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'completed')`,
        cancelled: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'cancelled')`,
        pending: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'pending')`,
        avg: sql<string>`COALESCE(AVG(${orders.totalAmount}), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, since));

    return {
      total: Number(row?.total ?? 0),
      completed: Number(row?.completed ?? 0),
      cancelled: Number(row?.cancelled ?? 0),
      pending: Number(row?.pending ?? 0),
      avgOrderValue: Math.round(Number(row?.avg ?? 0) * 100) / 100,
    };
  }

  async getUserGrowth(since: Date) {
    const periodMs = Date.now() - since.getTime();
    const previousStart = new Date(since.getTime() - periodMs);

    const [newUsersRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(gte(users.createdAt, since));

    const [previousUsersRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(and(gte(users.createdAt, previousStart), lt(users.createdAt, since)));

    const [totalUsersRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users);

    const [sellersRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sellerProfiles)
      .where(gte(sellerProfiles.createdAt, since));

    const newUsers = Number(newUsersRow?.count ?? 0);
    const previous = Number(previousUsersRow?.count ?? 0);
    const percentChange =
      previous === 0
        ? newUsers > 0
          ? 100
          : 0
        : ((newUsers - previous) / previous) * 100;

    return {
      newUsers,
      totalUsers: Number(totalUsersRow?.count ?? 0),
      sellersRegistered: Number(sellersRow?.count ?? 0),
      previousPeriod: previous,
      percentChange: Math.round(percentChange * 10) / 10,
    };
  }

  async getListingStats(since: Date) {
    const [newRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(listings)
      .where(gte(listings.createdAt, since));

    const [activeRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(listings)
      .where(eq(listings.status, "active"));

    const [aggRow] = await this.db
      .select({
        views: sql<number>`COALESCE(SUM(${listings.viewCount}), 0)`,
        favs: sql<number>`COALESCE(SUM(${listings.favoriteCount}), 0)`,
      })
      .from(listings);

    return {
      newListings: Number(newRow?.count ?? 0),
      totalActive: Number(activeRow?.count ?? 0),
      totalViews: Number(aggRow?.views ?? 0),
      totalFavorites: Number(aggRow?.favs ?? 0),
    };
  }

  async getTopBreeds(since: Date) {
    const rows = await this.db
      .select({
        breed: listings.breed,
        count: sql<number>`COUNT(*)`,
      })
      .from(listings)
      .where(and(gte(listings.createdAt, since), isNotNull(listings.breed)))
      .groupBy(listings.breed)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5);

    const total = rows.reduce(
      (sum: number, r: { count: number }) => sum + Number(r.count),
      0,
    );

    return rows.map((r: { breed: string | null; count: number }) => ({
      breed: r.breed ?? "Unknown",
      count: Number(r.count),
      percentageOfTotal:
        total === 0
          ? 0
          : Math.round((Number(r.count) / total) * 1000) / 10,
    }));
  }

  async getTopProvinces(since: Date) {
    const listingRows = await this.db
      .select({
        province: listings.locationProvince,
        count: sql<number>`COUNT(*)`,
      })
      .from(listings)
      .where(gte(listings.createdAt, since))
      .groupBy(listings.locationProvince)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5);

    // Orders per province require joining through listings.
    const result = [] as Array<{
      province: string;
      listings: number;
      orders: number;
    }>;

    for (const row of listingRows) {
      const province: string = row.province ?? "Unknown";
      const [orderRow] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .innerJoin(listings, eq(orders.listingId, listings.id))
        .where(
          and(
            gte(orders.createdAt, since),
            eq(listings.locationProvince, province),
          ),
        );

      result.push({
        province,
        listings: Number(row.count),
        orders: Number(orderRow?.count ?? 0),
      });
    }

    return result;
  }

  async getDailyRevenue(since: Date) {
    const rows = await this.db
      .select({
        date: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql<string>`COALESCE(SUM(${orders.platformFee}), 0)`,
        orders: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, "completed"),
          gte(orders.createdAt, since),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD') ASC`);

    const byDate = new Map<string, { revenue: number; orders: number }>();
    for (const r of rows as Array<{
      date: string;
      revenue: string;
      orders: number;
    }>) {
      byDate.set(r.date, {
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      });
    }

    // Fill in missing days so the chart renders evenly spaced bars.
    const series: Array<{ date: string; revenue: number; orders: number }> = [];
    const start = new Date(
      Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate()),
    );
    const end = new Date();
    const today = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
    );

    for (
      let d = new Date(start);
      d.getTime() <= today.getTime();
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const key = d.toISOString().slice(0, 10);
      const entry = byDate.get(key) ?? { revenue: 0, orders: 0 };
      series.push({ date: key, revenue: entry.revenue, orders: entry.orders });
    }

    return series;
  }
}
