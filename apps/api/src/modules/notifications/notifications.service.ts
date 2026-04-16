import { Injectable, Inject, Logger } from "@nestjs/common";
import { eq, and, desc, sql, lt } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { notifications, users } from "../../database/schema";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  /**
   * Simulate email delivery. In production, replace with SendGrid/AWS SES.
   * For now, looks up user email and logs what would be sent.
   */
  private async simulateEmailDelivery(
    userId: string,
    title: string,
    body: string,
  ) {
    try {
      const user = await this.db
        .select({ email: users.email, firstName: users.firstName })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user[0]?.email) {
        this.logger.log(
          `\n` +
            `========================================\n` +
            `  EMAIL SIMULATION\n` +
            `========================================\n` +
            `  To: ${user[0].email} (${user[0].firstName})\n` +
            `  Subject: ${title}\n` +
            `  Body: ${body}\n` +
            `========================================`,
        );
      } else {
        this.logger.warn(
          `Email simulation skipped: no email on file for user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(`Email simulation failed for user ${userId}`, error);
    }
  }

  async create(data: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    data?: any;
  }) {
    const [notification] = await this.db
      .insert(notifications)
      .values(data)
      .returning();

    // Fire-and-forget email simulation (don't block the response)
    this.simulateEmailDelivery(
      data.userId,
      data.title,
      data.body || data.title,
    );

    return notification;
  }

  async getMyNotifications(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(eq(notifications.userId, userId)),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + data.length < total,
      },
    };
  }

  async getUnreadCount(userId: string) {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      );

    return { count: Number(result?.count || 0) };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      );

    return { message: "Marked as read" };
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      );

    return { message: "All notifications marked as read" };
  }

  async deleteOld(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          lt(notifications.createdAt, thirtyDaysAgo),
        ),
      )
      .returning({ id: notifications.id });

    return {
      message: `Deleted ${result.length} old notification(s)`,
      deletedCount: result.length,
    };
  }
}
