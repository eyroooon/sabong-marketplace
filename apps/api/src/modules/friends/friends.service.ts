import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { eq, and, or, sql, desc } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { friendships, users } from "../../database/schema";
import { NotificationsService } from "../notifications/notifications.service";
import { canonicalPair } from "./canonical-pair";

export type FriendStatus =
  | "none"
  | "friends"
  | "request_sent"
  | "request_received"
  | "blocked"
  | "declined";

@Injectable()
export class FriendsService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private notificationsService: NotificationsService,
  ) {}

  async sendRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException("Cannot friend yourself");
    }

    const [target] = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, toUserId))
      .limit(1);
    if (!target) throw new NotFoundException("User not found");

    const { userAId, userBId } = canonicalPair(fromUserId, toUserId);

    const [existing] = await this.db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userAId, userAId),
          eq(friendships.userBId, userBId),
        ),
      )
      .limit(1);

    if (existing) {
      if (existing.status === "accepted") {
        throw new ConflictException("Already friends");
      }
      if (existing.status === "pending") {
        throw new ConflictException("Request already pending");
      }
      if (existing.status === "blocked") {
        throw new ForbiddenException("Cannot send request");
      }
      // If declined, allow re-request by updating existing row
      await this.db
        .update(friendships)
        .set({
          status: "pending",
          requestedById: fromUserId,
          createdAt: new Date(),
          acceptedAt: null,
        })
        .where(eq(friendships.id, existing.id));
    } else {
      await this.db.insert(friendships).values({
        userAId,
        userBId,
        status: "pending",
        requestedById: fromUserId,
      });
    }

    // Notify target of incoming request
    const [me] = await this.db
      .select({
        firstName: users.firstName,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, fromUserId))
      .limit(1);
    const myName = me?.displayName || me?.firstName || "Someone";
    await this.notificationsService.create({
      userId: toUserId,
      type: "friend_request",
      title: "New friend request",
      body: `${myName} sent you a friend request`,
      data: { fromUserId },
    });

    return { ok: true };
  }

  async acceptRequest(userId: string, fromUserId: string) {
    const { userAId, userBId } = canonicalPair(userId, fromUserId);
    const [row] = await this.db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userAId, userAId),
          eq(friendships.userBId, userBId),
          eq(friendships.status, "pending"),
        ),
      )
      .limit(1);

    if (!row) throw new NotFoundException("No pending request");
    if (row.requestedById === userId) {
      throw new BadRequestException("Cannot accept your own request");
    }

    await this.db
      .update(friendships)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(friendships.id, row.id));

    // Bump denormalized counters
    await Promise.all([
      this.db
        .update(users)
        .set({ friendsCount: sql`${users.friendsCount} + 1` })
        .where(eq(users.id, userId)),
      this.db
        .update(users)
        .set({ friendsCount: sql`${users.friendsCount} + 1` })
        .where(eq(users.id, fromUserId)),
    ]);

    // Notify the original requester
    const [me] = await this.db
      .select({
        firstName: users.firstName,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const myName = me?.displayName || me?.firstName || "Someone";
    await this.notificationsService.create({
      userId: fromUserId,
      type: "friend_accepted",
      title: "Friend request accepted",
      body: `${myName} accepted your friend request`,
      data: { withUserId: userId },
    });

    return { ok: true };
  }

  async declineRequest(userId: string, fromUserId: string) {
    const { userAId, userBId } = canonicalPair(userId, fromUserId);
    await this.db
      .update(friendships)
      .set({ status: "declined" })
      .where(
        and(
          eq(friendships.userAId, userAId),
          eq(friendships.userBId, userBId),
          eq(friendships.status, "pending"),
        ),
      );
    return { ok: true };
  }

  async removeFriend(userId: string, otherId: string) {
    const { userAId, userBId } = canonicalPair(userId, otherId);
    const [row] = await this.db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userAId, userAId),
          eq(friendships.userBId, userBId),
          eq(friendships.status, "accepted"),
        ),
      )
      .limit(1);

    if (!row) throw new NotFoundException("Not friends");

    await this.db.delete(friendships).where(eq(friendships.id, row.id));

    await Promise.all([
      this.db
        .update(users)
        .set({ friendsCount: sql`GREATEST(${users.friendsCount} - 1, 0)` })
        .where(eq(users.id, userId)),
      this.db
        .update(users)
        .set({ friendsCount: sql`GREATEST(${users.friendsCount} - 1, 0)` })
        .where(eq(users.id, otherId)),
    ]);

    return { ok: true };
  }

  async blockUser(userId: string, otherId: string) {
    if (userId === otherId) {
      throw new BadRequestException("Cannot block yourself");
    }
    const { userAId, userBId } = canonicalPair(userId, otherId);

    const [existing] = await this.db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userAId, userAId),
          eq(friendships.userBId, userBId),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .update(friendships)
        .set({ status: "blocked", requestedById: userId })
        .where(eq(friendships.id, existing.id));

      // If they were previously friends, decrement counters
      if (existing.status === "accepted") {
        await Promise.all([
          this.db
            .update(users)
            .set({ friendsCount: sql`GREATEST(${users.friendsCount} - 1, 0)` })
            .where(eq(users.id, userId)),
          this.db
            .update(users)
            .set({ friendsCount: sql`GREATEST(${users.friendsCount} - 1, 0)` })
            .where(eq(users.id, otherId)),
        ]);
      }
    } else {
      await this.db.insert(friendships).values({
        userAId,
        userBId,
        status: "blocked",
        requestedById: userId,
      });
    }
    return { ok: true };
  }

  async listFriends(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const rows = await this.db
      .select({
        friendship: friendships,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          city: users.city,
          province: users.province,
        },
      })
      .from(friendships)
      .innerJoin(
        users,
        sql`${users.id} = CASE
          WHEN ${friendships.userAId} = ${userId} THEN ${friendships.userBId}
          ELSE ${friendships.userAId}
        END`,
      )
      .where(
        and(
          or(
            eq(friendships.userAId, userId),
            eq(friendships.userBId, userId),
          ),
          eq(friendships.status, "accepted"),
        ),
      )
      .orderBy(desc(friendships.acceptedAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r: any) => ({
      ...r.user,
      friendsSince: r.friendship.acceptedAt,
    }));
  }

  async getStatus(userId: string, otherId: string): Promise<FriendStatus> {
    if (userId === otherId) return "none";
    const { userAId, userBId } = canonicalPair(userId, otherId);
    const [row] = await this.db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userAId, userAId),
          eq(friendships.userBId, userBId),
        ),
      )
      .limit(1);
    if (!row) return "none";
    if (row.status === "accepted") return "friends";
    if (row.status === "blocked") return "blocked";
    if (row.status === "declined") return "declined";
    if (row.status === "pending") {
      return row.requestedById === userId ? "request_sent" : "request_received";
    }
    return "none";
  }

  async listIncomingRequests(userId: string) {
    const rows = await this.db
      .select({
        friendship: friendships,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          city: users.city,
          province: users.province,
        },
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.requestedById))
      .where(
        and(
          eq(friendships.status, "pending"),
          or(
            and(
              eq(friendships.userAId, userId),
              sql`${friendships.requestedById} != ${userId}`,
            ),
            and(
              eq(friendships.userBId, userId),
              sql`${friendships.requestedById} != ${userId}`,
            ),
          ),
        ),
      )
      .orderBy(desc(friendships.createdAt));

    return rows.map((r: any) => ({
      ...r.user,
      requestedAt: r.friendship.createdAt,
    }));
  }

  async listOutgoingRequests(userId: string) {
    const rows = await this.db
      .select({
        friendship: friendships,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          city: users.city,
          province: users.province,
        },
      })
      .from(friendships)
      .innerJoin(
        users,
        sql`${users.id} = CASE
          WHEN ${friendships.userAId} = ${userId} THEN ${friendships.userBId}
          ELSE ${friendships.userAId}
        END`,
      )
      .where(
        and(
          eq(friendships.status, "pending"),
          eq(friendships.requestedById, userId),
          or(
            eq(friendships.userAId, userId),
            eq(friendships.userBId, userId),
          ),
        ),
      )
      .orderBy(desc(friendships.createdAt));

    return rows.map((r: any) => ({
      ...r.user,
      requestedAt: r.friendship.createdAt,
    }));
  }
}
