import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { eq, and, sql, desc } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { follows, users } from "../../database/schema";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class FollowsService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private notificationsService: NotificationsService,
  ) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException("You can't follow yourself");
    }

    const [target] = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, followingId))
      .limit(1);
    if (!target) throw new NotFoundException("User not found");

    try {
      await this.db.insert(follows).values({ followerId, followingId });
    } catch (err: any) {
      if (err?.code === "23505") {
        throw new ConflictException("Already following");
      }
      throw err;
    }

    // Update denormalized counts
    await Promise.all([
      this.db
        .update(users)
        .set({ followingCount: sql`${users.followingCount} + 1` })
        .where(eq(users.id, followerId)),
      this.db
        .update(users)
        .set({ followersCount: sql`${users.followersCount} + 1` })
        .where(eq(users.id, followingId)),
    ]);

    // Notify target
    const [me] = await this.db
      .select({
        firstName: users.firstName,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, followerId))
      .limit(1);
    const myName = me?.displayName || me?.firstName || "Someone";
    await this.notificationsService.create({
      userId: followingId,
      type: "new_follower",
      title: "New follower",
      body: `${myName} started following you`,
      data: { followerId },
    });

    return { message: "Followed" };
  }

  async unfollow(followerId: string, followingId: string) {
    const deleted = await this.db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
        ),
      )
      .returning();

    if (deleted.length === 0) {
      return { message: "Not following" };
    }

    await Promise.all([
      this.db
        .update(users)
        .set({ followingCount: sql`GREATEST(${users.followingCount} - 1, 0)` })
        .where(eq(users.id, followerId)),
      this.db
        .update(users)
        .set({ followersCount: sql`GREATEST(${users.followersCount} - 1, 0)` })
        .where(eq(users.id, followingId)),
    ]);

    return { message: "Unfollowed" };
  }

  async isFollowing(followerId: string, followingId: string) {
    const [row] = await this.db
      .select({ id: follows.id })
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
        ),
      )
      .limit(1);
    return { following: !!row };
  }

  async listFollowers(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const data = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        followedAt: follows.createdAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId))
      .orderBy(desc(follows.createdAt))
      .limit(limit)
      .offset(offset);
    return { data };
  }

  async listFollowing(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const data = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        followedAt: follows.createdAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt))
      .limit(limit)
      .offset(offset);
    return { data };
  }
}
