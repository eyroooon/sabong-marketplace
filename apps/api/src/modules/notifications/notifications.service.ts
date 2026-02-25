import { Injectable, Inject } from "@nestjs/common";
import { eq, and, desc, sql } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { notifications } from "../../database/schema";

@Injectable()
export class NotificationsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

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

    return notification;
  }

  async getMyNotifications(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const data = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return { data };
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
}
