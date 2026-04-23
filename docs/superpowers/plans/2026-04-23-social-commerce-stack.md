# Social Commerce Stack Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform BloodlinePH from a marketplace + video feed into a full social commerce platform where sabungeros communicate, discover, shop, and belong — combining Facebook (friends, groups), Instagram (stories, shoppable posts), Messenger (DMs with voice/groups/reactions), and TikTok Shop (reels → buy) into one culturally-native app.

**Architecture:**
- **Dual social graph**: existing one-way `follows` stays for creator-fan relationships; new `friendships` table adds mutual friend mechanic with request/accept flow.
- **Universal messaging**: evolve listing-scoped `conversations` into a polymorphic `chats` model supporting 1:1 DMs, group chats, listing-scoped chats. Add voice notes, reactions, replies, typing indicators, read receipts.
- **Shoppable reels**: many-to-many `video_listings` join table lets creators tag listings in any video. Frontend renders a floating "🛒 N items" pill.
- **Bloodline groups**: new `groups`, `group_members`, `group_posts` tables. Simple forum model, not full Facebook-complexity (no nested comments, no events initially).
- **Stories**: new `stories` table with 24h TTL. Separate from video feed (feed = durable, stories = ephemeral).
- **Live streams**: new `live_streams` table with HLS URL + viewer count; mock playback uses pre-recorded video for demo.

**Tech Stack:**
- Backend: NestJS 10 · Drizzle ORM · PostgreSQL · Socket.IO (existing)
- Web: Next.js 15 App Router · Tailwind · React Query · Zustand
- Mobile: Expo SDK 54 · Expo Router · React Native · React Query
- Shared: `packages/shared` for enums and validators (already wired)
- Audio: expo-av (mobile) + native MediaRecorder (web) for voice notes
- Live: HLS.js on web, expo-video on mobile (already installed)

**Pitch:** This plan ships Phase 1 as the core social foundation. Phases 2 & 3 are outlined but should have their own expanded plan documents before execution.

---

## Chunk 1: Phase 1 — Social Graph & Messaging Foundation

**Scope:** The core that unlocks everything else — friend requests, universal messaging, discovery, shoppable reels.

**Order of tasks (critical — each builds on the last):**

1. Friend graph schema + backend
2. Friend discovery (search, contacts, suggestions)
3. Universal messaging backend (group chats, voice, reactions, replies, typing)
4. Universal messaging web UI
5. Universal messaging mobile UI
6. Shoppable reels backend
7. Shoppable reels web UI
8. Shoppable reels mobile UI
9. Demo seed data for Phase 1
10. Phase 1 smoke test + pitch rehearsal

**Dependencies:** existing `users`, `follows`, `conversations`, `messages`, `videos`, `listings` tables. WebSocket gateway at `apps/api/src/modules/messages/messages.gateway.ts`.

---

### Task 1: Friend Graph Schema

**Files:**
- Create: `apps/api/src/database/schema/friendships.ts`
- Modify: `apps/api/src/database/schema/index.ts` (export the new schema)
- Modify: `apps/api/src/database/schema/users.ts` (add `friendsCount` denormalized counter)
- Migration: run `pnpm --filter @sabong/api db:generate` then `db:migrate`

**Design notes:**
- `friendships` stores both pending and accepted friend relationships
- Unique on `(userAId, userBId)` with `userAId < userBId` invariant — enforced at app layer by always sorting IDs before insert. This guarantees a single row per pair.
- `status`: `'pending' | 'accepted' | 'declined' | 'blocked'`
- `requestedBy`: which user initiated (useful for showing "Pedro sent you a friend request")

- [ ] **Step 1: Create schema file**

```typescript
// apps/api/src/database/schema/friendships.ts
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Mutual friendship relationship (bidirectional).
 *
 * INVARIANT: Always insert with userAId < userBId (lexicographic UUID sort).
 * This keeps one row per pair regardless of who sent the request.
 * Use helper `canonicalPair(idA, idB)` before any insert.
 */
export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userAId: uuid("user_a_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userBId: uuid("user_b_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull(), // pending | accepted | declined | blocked
    requestedById: uuid("requested_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_friendships_unique_pair").on(table.userAId, table.userBId),
    index("idx_friendships_user_a").on(table.userAId),
    index("idx_friendships_user_b").on(table.userBId),
    index("idx_friendships_status").on(table.status),
  ],
);
```

- [ ] **Step 2: Export from schema index**

```typescript
// apps/api/src/database/schema/index.ts — add export
export * from "./friendships";
```

- [ ] **Step 3: Add denormalized `friendsCount` to users schema**

```typescript
// apps/api/src/database/schema/users.ts — add to existing column list:
friendsCount: integer("friends_count").default(0).notNull(),
```

- [ ] **Step 4: Generate migration**

Run: `pnpm --filter @sabong/api db:generate`
Expected: new file in `apps/api/src/database/migrations/NNNN_*.sql` with `CREATE TABLE friendships` and `ALTER TABLE users ADD COLUMN friends_count`.

- [ ] **Step 5: Review and apply migration**

Run: `pnpm --filter @sabong/api db:migrate`
Expected: "Migration N applied" — no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/database/schema/friendships.ts \
        apps/api/src/database/schema/index.ts \
        apps/api/src/database/schema/users.ts \
        apps/api/src/database/migrations/
git commit -m "feat(social): add friendships schema with canonical-pair invariant"
```

---

### Task 2: Friend Graph Backend Module

**Files:**
- Create: `apps/api/src/modules/friends/friends.module.ts`
- Create: `apps/api/src/modules/friends/friends.service.ts`
- Create: `apps/api/src/modules/friends/friends.controller.ts`
- Create: `apps/api/src/modules/friends/dto/friend-action.dto.ts`
- Create: `apps/api/src/modules/friends/friends.service.spec.ts`
- Modify: `apps/api/src/app.module.ts` (register FriendsModule)

**Endpoints:**
- `POST /friends/request` `{ userId }` → send friend request
- `POST /friends/accept` `{ userId }` → accept pending request
- `POST /friends/decline` `{ userId }` → decline pending request
- `POST /friends/remove` `{ userId }` → unfriend
- `POST /friends/block` `{ userId }` → block
- `GET /friends` → list accepted friends (paginated)
- `GET /friends/requests/incoming` → list pending requests received
- `GET /friends/requests/outgoing` → list pending requests sent
- `GET /friends/status/:userId` → get relationship with a specific user

- [ ] **Step 1: Create canonical pair helper**

```typescript
// apps/api/src/modules/friends/canonical-pair.ts
/**
 * Sort two UUIDs lexicographically for friendship table insertion.
 * Ensures one row per user pair regardless of who initiated.
 */
export function canonicalPair(
  idA: string,
  idB: string,
): { userAId: string; userBId: string } {
  return idA < idB
    ? { userAId: idA, userBId: idB }
    : { userAId: idB, userBId: idA };
}
```

- [ ] **Step 2: Write failing test for sending a friend request**

```typescript
// apps/api/src/modules/friends/friends.service.spec.ts
import { canonicalPair } from "./canonical-pair";

describe("canonicalPair", () => {
  it("sorts two UUIDs lexicographically", () => {
    const a = "00000000-0000-0000-0000-000000000002";
    const b = "00000000-0000-0000-0000-000000000001";
    expect(canonicalPair(a, b)).toEqual({ userAId: b, userBId: a });
    expect(canonicalPair(b, a)).toEqual({ userAId: b, userBId: a });
  });

  it("rejects self-pairing detection at caller", () => {
    const a = "00000000-0000-0000-0000-000000000001";
    // caller should guard; helper just sorts
    expect(canonicalPair(a, a)).toEqual({ userAId: a, userBId: a });
  });
});
```

Run: `pnpm --filter @sabong/api test friends.service.spec -- --watch=false`
Expected: PASS (pure helper)

- [ ] **Step 3: Implement FriendsService**

```typescript
// apps/api/src/modules/friends/friends.service.ts
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

@Injectable()
export class FriendsService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private notifications: NotificationsService,
  ) {}

  async sendRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException("Cannot friend yourself");
    }
    const target = await this.db.query.users.findFirst({
      where: eq(users.id, toUserId),
    });
    if (!target) throw new NotFoundException("User not found");

    const { userAId, userBId } = canonicalPair(fromUserId, toUserId);

    const existing = await this.db.query.friendships.findFirst({
      where: and(
        eq(friendships.userAId, userAId),
        eq(friendships.userBId, userBId),
      ),
    });

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
      // If declined, allow re-request by updating row
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

    await this.notifications.create({
      userId: toUserId,
      type: "friend_request",
      title: "New friend request",
      body: `You have a new friend request`,
      data: { fromUserId },
    });

    return { ok: true };
  }

  async acceptRequest(userId: string, fromUserId: string) {
    const { userAId, userBId } = canonicalPair(userId, fromUserId);
    const row = await this.db.query.friendships.findFirst({
      where: and(
        eq(friendships.userAId, userAId),
        eq(friendships.userBId, userBId),
        eq(friendships.status, "pending"),
      ),
    });
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

    await this.notifications.create({
      userId: fromUserId,
      type: "friend_accepted",
      title: "Friend request accepted",
      body: "You're now friends",
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
    const row = await this.db.query.friendships.findFirst({
      where: and(
        eq(friendships.userAId, userAId),
        eq(friendships.userBId, userBId),
        eq(friendships.status, "accepted"),
      ),
    });
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
    const { userAId, userBId } = canonicalPair(userId, otherId);
    const existing = await this.db.query.friendships.findFirst({
      where: and(
        eq(friendships.userAId, userAId),
        eq(friendships.userBId, userBId),
      ),
    });
    if (existing) {
      await this.db
        .update(friendships)
        .set({ status: "blocked", requestedById: userId })
        .where(eq(friendships.id, existing.id));
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

    return rows.map((r) => ({
      ...r.user,
      friendsSince: r.friendship.acceptedAt,
    }));
  }

  async getStatus(
    userId: string,
    otherId: string,
  ): Promise<
    "none" | "friends" | "request_sent" | "request_received" | "blocked"
  > {
    if (userId === otherId) return "none";
    const { userAId, userBId } = canonicalPair(userId, otherId);
    const row = await this.db.query.friendships.findFirst({
      where: and(
        eq(friendships.userAId, userAId),
        eq(friendships.userBId, userBId),
      ),
    });
    if (!row) return "none";
    if (row.status === "accepted") return "friends";
    if (row.status === "blocked") return "blocked";
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

    return rows.map((r) => ({
      ...r.user,
      requestedAt: r.friendship.createdAt,
    }));
  }
}
```

- [ ] **Step 4: Create controller, module, DTOs**

```typescript
// apps/api/src/modules/friends/dto/friend-action.dto.ts
import { IsUUID } from "class-validator";

export class FriendActionDto {
  @IsUUID()
  userId!: string;
}
```

```typescript
// apps/api/src/modules/friends/friends.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { FriendsService } from "./friends.service";
import { FriendActionDto } from "./dto/friend-action.dto";

@Controller("friends")
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post("request")
  request(@CurrentUser() me: any, @Body() dto: FriendActionDto) {
    return this.friendsService.sendRequest(me.id, dto.userId);
  }

  @Post("accept")
  accept(@CurrentUser() me: any, @Body() dto: FriendActionDto) {
    return this.friendsService.acceptRequest(me.id, dto.userId);
  }

  @Post("decline")
  decline(@CurrentUser() me: any, @Body() dto: FriendActionDto) {
    return this.friendsService.declineRequest(me.id, dto.userId);
  }

  @Post("remove")
  remove(@CurrentUser() me: any, @Body() dto: FriendActionDto) {
    return this.friendsService.removeFriend(me.id, dto.userId);
  }

  @Post("block")
  block(@CurrentUser() me: any, @Body() dto: FriendActionDto) {
    return this.friendsService.blockUser(me.id, dto.userId);
  }

  @Get()
  list(@CurrentUser() me: any) {
    return this.friendsService.listFriends(me.id);
  }

  @Get("requests/incoming")
  incoming(@CurrentUser() me: any) {
    return this.friendsService.listIncomingRequests(me.id);
  }

  @Get("status/:userId")
  status(@CurrentUser() me: any, @Param("userId") userId: string) {
    return this.friendsService.getStatus(me.id, userId);
  }
}
```

```typescript
// apps/api/src/modules/friends/friends.module.ts
import { Module } from "@nestjs/common";
import { FriendsController } from "./friends.controller";
import { FriendsService } from "./friends.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
```

- [ ] **Step 5: Register in app.module**

Modify `apps/api/src/app.module.ts`:
```typescript
import { FriendsModule } from "./modules/friends/friends.module";
// add to imports array:
FriendsModule,
```

- [ ] **Step 6: Smoke test**

```bash
pnpm --filter @sabong/api dev  # terminal 1
```

In terminal 2 (use existing seeded users — admin token via login):
```bash
# Login as Pedro
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+639175555555","password":"Demo1234!"}' | jq -r .accessToken)

# Send request from Pedro to Reylyn
curl -X POST http://localhost:3001/api/friends/request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<REYLYN_UUID>"}'

# Expected: {"ok":true}
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/friends/ apps/api/src/app.module.ts
git commit -m "feat(social): friends module with request/accept/decline/block flow"
```

---

### Task 3: Friend Discovery Backend

**Files:**
- Modify: `apps/api/src/modules/users/users.service.ts` (add `searchUsers`, `suggestFriends`)
- Modify: `apps/api/src/modules/users/users.controller.ts` (add `/users/search`, `/users/suggestions`)

**Design:**
- Search: match on `firstName`, `lastName`, `displayName`, `phone` with `ILIKE` — fast enough for demo-scale, swap to Meilisearch if slow.
- Suggestions: rank by (mutual friends count) + (same region) + (recent transactions) + (already-follows). Simple SQL for now.

- [ ] **Step 1: Add `searchUsers` method**

```typescript
// apps/api/src/modules/users/users.service.ts — add method
async searchUsers(query: string, currentUserId: string, limit = 20) {
  if (!query || query.length < 2) return [];
  const pattern = `%${query}%`;
  const rows = await this.db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      city: users.city,
      province: users.province,
      isVerifiedSeller: users.isVerifiedSeller,
    })
    .from(users)
    .where(
      and(
        sql`${users.id} != ${currentUserId}`,
        or(
          sql`${users.firstName} ILIKE ${pattern}`,
          sql`${users.lastName} ILIKE ${pattern}`,
          sql`${users.displayName} ILIKE ${pattern}`,
          sql`${users.phone} ILIKE ${pattern}`,
        ),
      ),
    )
    .limit(limit);
  return rows;
}
```

- [ ] **Step 2: Add `suggestFriends` method**

```typescript
// Simple suggestion heuristic: same province, not already friends/blocked
async suggestFriends(currentUserId: string, limit = 10) {
  const me = await this.db.query.users.findFirst({
    where: eq(users.id, currentUserId),
  });
  if (!me) return [];

  const suggestions = await this.db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      city: users.city,
      province: users.province,
    })
    .from(users)
    .where(
      and(
        sql`${users.id} != ${currentUserId}`,
        eq(users.province, me.province),
        // Exclude existing friendship rows
        sql`NOT EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.user_a_id = ${currentUserId} AND f.user_b_id = ${users.id})
             OR (f.user_b_id = ${currentUserId} AND f.user_a_id = ${users.id})
        )`,
      ),
    )
    .limit(limit);

  return suggestions;
}
```

- [ ] **Step 3: Add controller routes**

```typescript
// apps/api/src/modules/users/users.controller.ts
@Get("search")
search(@Query("q") q: string, @CurrentUser() me: any) {
  return this.usersService.searchUsers(q, me.id);
}

@Get("suggestions")
suggestions(@CurrentUser() me: any) {
  return this.usersService.suggestFriends(me.id);
}
```

- [ ] **Step 4: Smoke test**

```bash
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/users/search?q=mang"
# Expected: [{ id, firstName: "Mang", ... }]

curl -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/users/suggestions"
# Expected: array of nearby users
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/users/
git commit -m "feat(social): user search + friend suggestions"
```

---

### Task 4: Universal Messaging Schema Evolution

**Files:**
- Create: `apps/api/src/database/schema/chats.ts` (new polymorphic chat table)
- Modify: `apps/api/src/database/schema/messages.ts` (add reactions, replyTo, voice/attachment fields)
- Create: `apps/api/src/database/schema/message-reactions.ts`
- Create: `apps/api/src/database/schema/chat-participants.ts`
- Migration: generate + migrate

**Design decision:**

The existing `conversations` table is listing-scoped (buyerId + sellerId per listing). For universal messaging, we need:
- 1:1 chats not tied to any listing
- Group chats with N participants
- Original listing-scoped chats preserved (backward compatible)

**Approach:** Add a new `chats` table that supersedes `conversations`, migrate existing conversation rows into `chats` with `type='listing'`. Keep `conversations` as a read-only view for now (or drop after migration verified).

For the plan, **simpler path:** extend `conversations` to be polymorphic by adding `type` and making `listingId`/`buyerId`/`sellerId` nullable. Add a separate `chat_participants` table for group chats. This avoids a big bang migration.

- [ ] **Step 1: Extend conversations schema**

```typescript
// apps/api/src/database/schema/messages.ts — update conversations definition
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // NEW: chat type
    type: varchar("type", { length: 20 }).default("listing").notNull(),
    // 'listing' | 'dm' | 'group'

    title: varchar("title", { length: 100 }), // for group chats
    avatarUrl: text("avatar_url"), // group avatar

    // Legacy listing fields — nullable now
    listingId: uuid("listing_id").references(() => listings.id),
    buyerId: uuid("buyer_id").references(() => users.id),
    sellerId: uuid("seller_id").references(() => users.id),

    createdById: uuid("created_by_id").references(() => users.id),

    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessagePreview: varchar("last_message_preview", { length: 200 }),

    // Legacy unread counts — deprecated, moved to chat_participants
    buyerUnreadCount: integer("buyer_unread_count").default(0).notNull(),
    sellerUnreadCount: integer("seller_unread_count").default(0).notNull(),

    isArchivedBuyer: boolean("is_archived_buyer").default(false).notNull(),
    isArchivedSeller: boolean("is_archived_seller").default(false).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_conversations_unique")
      .on(table.listingId, table.buyerId, table.sellerId)
      .where(sql`type = 'listing'`),
    index("idx_conversations_type").on(table.type),
    index("idx_conversations_buyer").on(table.buyerId),
    index("idx_conversations_seller").on(table.sellerId),
  ],
);
```

- [ ] **Step 2: Create chat_participants table**

```typescript
// apps/api/src/database/schema/chat-participants.ts
import {
  pgTable,
  uuid,
  timestamp,
  integer,
  boolean,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { conversations } from "./messages";

export const chatParticipants = pgTable(
  "chat_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("member").notNull(),
    // 'owner' | 'admin' | 'member'
    unreadCount: integer("unread_count").default(0).notNull(),
    isMuted: boolean("is_muted").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_chat_participants_unique").on(
      table.conversationId,
      table.userId,
    ),
    index("idx_chat_participants_user").on(table.userId),
  ],
);
```

- [ ] **Step 3: Extend messages table**

```typescript
// apps/api/src/database/schema/messages.ts — update messages definition
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),

    content: text("content").notNull(),
    messageType: varchar("message_type", { length: 20 })
      .default("text")
      .notNull(),
    // 'text' | 'image' | 'video' | 'voice' | 'offer' | 'listing_share' | 'reel_share' | 'system'

    // NEW: rich media fields
    mediaUrl: text("media_url"),
    mediaDurationMs: integer("media_duration_ms"), // for voice notes
    mediaWidth: integer("media_width"),
    mediaHeight: integer("media_height"),

    // NEW: reply threading
    replyToMessageId: uuid("reply_to_message_id"),

    // NEW: attached object IDs (for listing/reel shares)
    attachedListingId: uuid("attached_listing_id").references(() => listings.id),
    attachedVideoId: uuid("attached_video_id"),

    // Legacy offer fields preserved
    offerAmount: decimal("offer_amount", { precision: 10, scale: 2 }),
    offerStatus: varchar("offer_status", { length: 20 }),

    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),

    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_messages_conversation").on(
      table.conversationId,
      table.createdAt,
    ),
    index("idx_messages_sender").on(table.senderId),
  ],
);
```

- [ ] **Step 4: Create message_reactions table**

```typescript
// apps/api/src/database/schema/message-reactions.ts
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { messages } from "./messages";

export const messageReactions = pgTable(
  "message_reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: varchar("emoji", { length: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_message_reactions_unique").on(
      table.messageId,
      table.userId,
      table.emoji,
    ),
  ],
);
```

- [ ] **Step 5: Data migration — backfill chat_participants for existing conversations**

Write a migration SQL file by hand (Drizzle `db:generate` won't produce this):

```sql
-- apps/api/src/database/migrations/MANUAL_backfill_chat_participants.sql
-- Run after the auto-generated migration creates the tables
INSERT INTO chat_participants (conversation_id, user_id, role, unread_count)
SELECT id, buyer_id, 'member', buyer_unread_count
FROM conversations
WHERE buyer_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO chat_participants (conversation_id, user_id, role, unread_count)
SELECT id, seller_id, 'member', seller_unread_count
FROM conversations
WHERE seller_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

- [ ] **Step 6: Export, generate, migrate**

```typescript
// apps/api/src/database/schema/index.ts
export * from "./chat-participants";
export * from "./message-reactions";
```

Run:
```bash
pnpm --filter @sabong/api db:generate
pnpm --filter @sabong/api db:migrate
psql $DATABASE_URL -f apps/api/src/database/migrations/MANUAL_backfill_chat_participants.sql
```

Expected: new tables created, existing conversations now have corresponding participant rows.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/database/
git commit -m "feat(chat): polymorphic conversations + participants + reactions + reply schema"
```

---

### Task 5: Universal Messaging Service Upgrade

**Files:**
- Modify: `apps/api/src/modules/messages/messages.service.ts`
- Modify: `apps/api/src/modules/messages/messages.controller.ts`
- Modify: `apps/api/src/modules/messages/messages.gateway.ts`
- Create: `apps/api/src/modules/messages/dto/create-dm.dto.ts`
- Create: `apps/api/src/modules/messages/dto/create-group.dto.ts`
- Create: `apps/api/src/modules/messages/dto/react.dto.ts`
- Create: `apps/api/src/modules/messages/dto/typing.dto.ts`

**New endpoints:**
- `POST /messages/dm` `{ otherUserId }` → create or fetch existing 1:1 DM, returns `conversationId`
- `POST /messages/group` `{ title, memberUserIds[] }` → create group chat
- `POST /messages/:id/reactions` `{ emoji }` → toggle reaction
- `POST /messages/:id/reply` `{ content, messageType }` → reply to specific message
- `POST /conversations/:id/typing` (WS event) → broadcast typing indicator
- `POST /conversations/:id/read` → mark read, broadcast read receipt
- `GET /conversations` → list all user's chats (DMs + groups + listing chats, sorted by lastMessageAt)
- `POST /conversations/:id/members/add` `{ userIds[] }` → add group members
- `POST /conversations/:id/leave` → leave group

- [ ] **Step 1: Add DM creation logic**

```typescript
// messages.service.ts — new method
async getOrCreateDm(currentUserId: string, otherUserId: string) {
  if (currentUserId === otherUserId) {
    throw new BadRequestException("Cannot DM yourself");
  }

  // Check friendship/block
  const blockStatus = await this.db.query.friendships.findFirst({
    where: and(
      or(
        and(
          eq(friendships.userAId, currentUserId),
          eq(friendships.userBId, otherUserId),
        ),
        and(
          eq(friendships.userAId, otherUserId),
          eq(friendships.userBId, currentUserId),
        ),
      ),
      eq(friendships.status, "blocked"),
    ),
  });
  if (blockStatus) throw new ForbiddenException("Cannot message this user");

  // Look for existing DM
  const existing = await this.db
    .select()
    .from(conversations)
    .innerJoin(
      chatParticipants,
      eq(chatParticipants.conversationId, conversations.id),
    )
    .where(
      and(
        eq(conversations.type, "dm"),
        eq(chatParticipants.userId, currentUserId),
      ),
    )
    .limit(50);

  for (const row of existing) {
    const otherPart = await this.db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.conversationId, row.conversations.id),
        eq(chatParticipants.userId, otherUserId),
      ),
    });
    if (otherPart) {
      return { conversationId: row.conversations.id, created: false };
    }
  }

  // Create new
  const [convo] = await this.db
    .insert(conversations)
    .values({
      type: "dm",
      createdById: currentUserId,
    })
    .returning();

  await this.db.insert(chatParticipants).values([
    { conversationId: convo.id, userId: currentUserId, role: "member" },
    { conversationId: convo.id, userId: otherUserId, role: "member" },
  ]);

  return { conversationId: convo.id, created: true };
}
```

- [ ] **Step 2: Add group creation logic**

```typescript
async createGroupChat(
  currentUserId: string,
  title: string,
  memberIds: string[],
) {
  if (memberIds.length < 1) {
    throw new BadRequestException("Group needs at least 1 other member");
  }
  if (memberIds.length > 29) {
    throw new BadRequestException("Max 30 members per group");
  }
  const unique = Array.from(new Set([currentUserId, ...memberIds]));

  const [convo] = await this.db
    .insert(conversations)
    .values({
      type: "group",
      title,
      createdById: currentUserId,
    })
    .returning();

  await this.db.insert(chatParticipants).values(
    unique.map((uid) => ({
      conversationId: convo.id,
      userId: uid,
      role: uid === currentUserId ? "owner" : "member",
    })),
  );

  // Notify members
  for (const memberId of memberIds) {
    await this.notifications.create({
      userId: memberId,
      type: "group_added",
      title: `Added to group: ${title}`,
      body: "Tap to view",
      data: { conversationId: convo.id },
    });
  }

  return { conversationId: convo.id };
}
```

- [ ] **Step 3: Add reaction toggle**

```typescript
async toggleReaction(
  userId: string,
  messageId: string,
  emoji: string,
) {
  // Verify user has access to message via participant check
  const message = await this.db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  });
  if (!message) throw new NotFoundException("Message not found");
  const part = await this.db.query.chatParticipants.findFirst({
    where: and(
      eq(chatParticipants.conversationId, message.conversationId),
      eq(chatParticipants.userId, userId),
    ),
  });
  if (!part) throw new ForbiddenException();

  const existing = await this.db.query.messageReactions.findFirst({
    where: and(
      eq(messageReactions.messageId, messageId),
      eq(messageReactions.userId, userId),
      eq(messageReactions.emoji, emoji),
    ),
  });

  if (existing) {
    await this.db
      .delete(messageReactions)
      .where(eq(messageReactions.id, existing.id));
    return { action: "removed" };
  }

  await this.db.insert(messageReactions).values({
    messageId,
    userId,
    emoji,
  });

  // Broadcast via WS
  this.gateway.server?.to(`chat:${message.conversationId}`).emit("reaction", {
    messageId,
    userId,
    emoji,
    action: "added",
  });

  return { action: "added" };
}
```

- [ ] **Step 4: Update WebSocket gateway for typing + read receipts + presence**

```typescript
// messages.gateway.ts — add handlers
@SubscribeMessage("chat:typing")
handleTyping(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { conversationId: string },
) {
  const userId = this.extractUserId(client);
  client.to(`chat:${data.conversationId}`).emit("typing", {
    conversationId: data.conversationId,
    userId,
  });
}

@SubscribeMessage("chat:stop-typing")
handleStopTyping(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { conversationId: string },
) {
  const userId = this.extractUserId(client);
  client.to(`chat:${data.conversationId}`).emit("stop-typing", {
    conversationId: data.conversationId,
    userId,
  });
}

@SubscribeMessage("chat:read")
async handleRead(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { conversationId: string },
) {
  const userId = this.extractUserId(client);
  await this.messagesService.markConversationRead(data.conversationId, userId);
  this.server.to(`chat:${data.conversationId}`).emit("read-receipt", {
    conversationId: data.conversationId,
    userId,
    readAt: new Date().toISOString(),
  });
}
```

- [ ] **Step 5: Controller endpoints**

Wire controller routes to the new service methods. Follow existing patterns in `messages.controller.ts`.

- [ ] **Step 6: Integration test**

```bash
# Start API + seed
pnpm --filter @sabong/api dev

# Create DM
curl -X POST http://localhost:3001/api/messages/dm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherUserId":"<REYLYN_UUID>"}'
# Expected: {"conversationId":"...","created":true}

# Create group
curl -X POST http://localhost:3001/api/messages/group \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Kelso Circle","memberUserIds":["..."]}'
# Expected: {"conversationId":"..."}
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/messages/
git commit -m "feat(chat): universal messaging — DMs, groups, reactions, replies, typing, read receipts"
```

---

### Task 6: Voice Note Upload Support

**Files:**
- Modify: `apps/api/src/modules/uploads/uploads.service.ts` (add voice mime type)
- Modify: `apps/api/src/modules/messages/messages.service.ts` (handle voice message type)

- [ ] **Step 1: Allow audio mimetypes in uploads service**

Locate the `allowedMimeTypes` array in uploads service and extend:
```typescript
const audioMimes = ["audio/webm", "audio/mpeg", "audio/mp4", "audio/m4a"];
// Merge into existing allowed list
```

- [ ] **Step 2: Voice message creation wires mediaUrl + duration**

Existing `createMessage` logic already stores `mediaUrl`. Ensure frontend sends `messageType: "voice"`, `mediaUrl`, `mediaDurationMs`.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/uploads/
git commit -m "feat(chat): support audio uploads for voice notes"
```

---

### Task 7: Web — Messages Overhaul

**Files:**
- Modify: `apps/web/src/app/(dashboard)/messages/page.tsx` (conversation list)
- Modify: `apps/web/src/app/(dashboard)/messages/[id]/page.tsx` (chat view)
- Create: `apps/web/src/components/messages/ChatSidebar.tsx`
- Create: `apps/web/src/components/messages/MessageInput.tsx`
- Create: `apps/web/src/components/messages/VoiceRecorder.tsx`
- Create: `apps/web/src/components/messages/ReactionPicker.tsx`
- Create: `apps/web/src/components/messages/TypingIndicator.tsx`
- Create: `apps/web/src/components/messages/NewChatModal.tsx`
- Create: `apps/web/src/components/messages/NewGroupModal.tsx`

**Design notes:**
- Left sidebar: unified list of all chats (DMs, groups, listing chats) with search
- Right pane: active chat with messages, input, reactions
- Voice recorder uses `MediaRecorder` browser API, uploads WebM audio on stop
- Typing indicator listens to WS `typing`/`stop-typing` events, shows "Pedro is typing..."
- Reactions: long-press/right-click any message → emoji picker → tap to toggle
- Reply: swipe left on message → sets reply state → next send includes replyToMessageId

- [ ] **Step 1: Build ChatSidebar component**

```tsx
// apps/web/src/components/messages/ChatSidebar.tsx
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export function ChatSidebar({ activeId }: { activeId?: string }) {
  const [query, setQuery] = useState("");
  const { data: chats = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiGet("/conversations"),
  });

  const filtered = chats.filter((c: any) =>
    c.title?.toLowerCase().includes(query.toLowerCase()) ||
    c.otherUser?.displayName?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <aside className="w-80 border-r border-white/5 h-full flex flex-col">
      <header className="p-4 border-b border-white/5 space-y-2">
        <h2 className="text-xl font-bold">Messages</h2>
        <input
          placeholder="Search chats..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white/5 rounded px-3 py-2 text-sm"
        />
      </header>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((chat: any) => (
          <Link
            key={chat.id}
            href={`/messages/${chat.id}`}
            className={`flex items-center gap-3 p-3 hover:bg-white/5 ${
              activeId === chat.id ? "bg-white/10" : ""
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
              {chat.type === "group"
                ? (chat.title?.[0] ?? "G")
                : (chat.otherUser?.displayName?.[0] ?? "?")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <p className="font-medium truncate">
                  {chat.type === "group"
                    ? chat.title
                    : chat.otherUser?.displayName}
                </p>
                {chat.lastMessageAt && (
                  <span className="text-xs text-white/40">
                    {formatTime(chat.lastMessageAt)}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/60 truncate">
                {chat.lastMessagePreview ?? "No messages yet"}
              </p>
            </div>
            {chat.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {chat.unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Build MessageInput with voice, reply, send**

Build the compound input: text field, emoji picker button, attach (image/video) button, voice record button, send button. Reply preview pill above when replying.

- [ ] **Step 3: Build VoiceRecorder component**

```tsx
// apps/web/src/components/messages/VoiceRecorder.tsx
"use client";
import { useState, useRef } from "react";

export function VoiceRecorder({
  onComplete,
}: {
  onComplete: (blob: Blob, durationMs: number) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onComplete(blob, Date.now() - startTimeRef.current);
      stream.getTracks().forEach((t) => t.stop());
    };
    recorder.start();
    startTimeRef.current = Date.now();
    mediaRecorderRef.current = recorder;
    setRecording(true);
    intervalRef.current = setInterval(() => {
      setDuration(Date.now() - startTimeRef.current);
    }, 100);
  }

  function stop() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDuration(0);
  }

  return (
    <button
      onMouseDown={start}
      onMouseUp={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      className={`p-2 rounded-full transition ${
        recording ? "bg-red-500 scale-110" : "bg-white/10 hover:bg-white/20"
      }`}
    >
      🎤{recording && <span className="ml-2">{(duration / 1000).toFixed(1)}s</span>}
    </button>
  );
}
```

- [ ] **Step 4: Upload + send voice flow**

On `onComplete`: upload the blob to `/uploads` endpoint, get URL, then send message with `messageType: "voice"`, `mediaUrl`, `mediaDurationMs`.

- [ ] **Step 5: ReactionPicker component**

Emoji row with 🔥 💎 👊 🏆 🤌 ❤️ 😂 😮. Click to toggle via `/messages/:id/reactions`.

- [ ] **Step 6: TypingIndicator listens to WS**

Use existing socket instance. On `typing` event for current conversation, show animated dots with user name. Clear after 3s or on `stop-typing`.

- [ ] **Step 7: NewChatModal — search users to start DM**

Uses `/users/search` endpoint, on user click calls `/messages/dm` with their ID, navigates to new conversation.

- [ ] **Step 8: NewGroupModal — multi-select friends to create group**

Select from friends list, enter group title, submit.

- [ ] **Step 9: Smoke test**

Open http://localhost:3000/messages, verify:
- Conversation list shows all chats
- Can click existing chat and see messages
- Click "New Chat" → search → start DM → send message
- Voice recording works (hold button, release)
- Typing indicator appears for other user
- Reactions toggle on hover
- Read receipts update

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): universal messaging UI — sidebar, voice, reactions, typing, groups"
```

---

### Task 8: Mobile — Messages Overhaul

**Files:**
- Modify: `apps/mobile/app/(tabs)/messages.tsx`
- Create: `apps/mobile/app/chat/[id].tsx` (if not exists, overhaul if does)
- Create: `apps/mobile/components/chat/MessageBubble.tsx`
- Create: `apps/mobile/components/chat/MessageInput.tsx`
- Create: `apps/mobile/components/chat/VoiceRecorderButton.tsx`
- Create: `apps/mobile/components/chat/ReactionSheet.tsx`
- Create: `apps/mobile/app/chat/new.tsx` (new chat picker)
- Create: `apps/mobile/app/chat/new-group.tsx` (new group creator)

**Mobile-specific:**
- Use `expo-av` for voice recording + playback
- Gesture handler: swipe-right on message to reply
- Long-press message → ReactionSheet bottom sheet with emoji row
- Native feel: animated bubble appearance, swipe-to-archive in list

- [ ] **Step 1: Install expo-av**

```bash
cd apps/mobile
npx expo install expo-av
```

- [ ] **Step 2: Build messages list with swipe actions**

(Adopt `react-native-gesture-handler` Swipeable pattern)

- [ ] **Step 3: Build chat screen with message bubbles**

```tsx
// apps/mobile/components/chat/MessageBubble.tsx
import { View, Text, Pressable, Image } from "react-native";
import { Audio } from "expo-av";
import { useState } from "react";

export function MessageBubble({
  message,
  isMe,
  onLongPress,
  onSwipeReply,
}: {
  message: any;
  isMe: boolean;
  onLongPress: () => void;
  onSwipeReply: () => void;
}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  async function playVoice() {
    if (sound) {
      playing ? await sound.pauseAsync() : await sound.playAsync();
      setPlaying(!playing);
      return;
    }
    const { sound: newSound } = await Audio.Sound.createAsync({
      uri: message.mediaUrl,
    });
    setSound(newSound);
    await newSound.playAsync();
    setPlaying(true);
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setPlaying(false);
    });
  }

  return (
    <Pressable
      onLongPress={onLongPress}
      style={{
        alignSelf: isMe ? "flex-end" : "flex-start",
        backgroundColor: isMe ? "#dc2626" : "#262626",
        borderRadius: 16,
        padding: 10,
        marginVertical: 2,
        maxWidth: "80%",
      }}
    >
      {message.messageType === "voice" ? (
        <Pressable onPress={playVoice} style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 24 }}>
            {playing ? "⏸" : "▶"}
          </Text>
          <Text style={{ color: "white", marginLeft: 8 }}>
            🎤 {Math.round(message.mediaDurationMs / 1000)}s
          </Text>
        </Pressable>
      ) : message.messageType === "image" ? (
        <Image source={{ uri: message.mediaUrl }} style={{ width: 200, height: 200, borderRadius: 8 }} />
      ) : (
        <Text style={{ color: "white" }}>{message.content}</Text>
      )}
      {message.reactions?.length > 0 && (
        <View style={{ flexDirection: "row", marginTop: 4 }}>
          {message.reactions.map((r: any) => (
            <Text key={r.emoji} style={{ fontSize: 14 }}>
              {r.emoji} {r.count}
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}
```

- [ ] **Step 4: VoiceRecorderButton**

```tsx
import { Audio } from "expo-av";
import { Pressable, View, Text } from "react-native";
import { useState, useRef } from "react";

export function VoiceRecorderButton({
  onComplete,
}: {
  onComplete: (uri: string, durationMs: number) => void;
}) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef(0);

  async function start() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      startTimeRef.current = Date.now();
    } catch (e) {
      console.error(e);
    }
  }

  async function stop() {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const durMs = Date.now() - startTimeRef.current;
    setRecording(null);
    if (uri) onComplete(uri, durMs);
  }

  return (
    <Pressable
      onPressIn={start}
      onPressOut={stop}
      style={{
        backgroundColor: recording ? "#ef4444" : "#171717",
        padding: 12,
        borderRadius: 24,
      }}
    >
      <Text style={{ color: "white", fontSize: 20 }}>
        🎤 {recording ? "..." : ""}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 5: Integrate swipe-to-reply with react-native-gesture-handler**

Wrap `MessageBubble` in `Swipeable` from `react-native-gesture-handler`. On sufficient swipe, trigger `onSwipeReply` callback which sets a reply-to state in parent.

- [ ] **Step 6: ReactionSheet bottom sheet**

Use `@gorhom/bottom-sheet` (should already be installed) to render emoji row. On tap, call reaction toggle API.

- [ ] **Step 7: Test on device via Expo Go**

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/
git commit -m "feat(mobile): universal messaging — voice, reactions, swipe-reply, groups"
```

---

### Task 9: Shoppable Reels Schema

**Files:**
- Create: `apps/api/src/database/schema/video-listings.ts`
- Modify: `apps/api/src/database/schema/index.ts` (export)
- Generate + migrate

- [ ] **Step 1: Create join table**

```typescript
// apps/api/src/database/schema/video-listings.ts
import {
  pgTable,
  uuid,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { videos } from "./videos";
import { listings } from "./listings";

/**
 * Many-to-many: creators tag listings in their videos.
 * A video can have multiple tagged listings (up to ~5 reasonable).
 * A listing can appear in multiple videos.
 */
export const videoListings = pgTable(
  "video_listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").default(0).notNull(),
    clickCount: integer("click_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_video_listings_unique").on(table.videoId, table.listingId),
    index("idx_video_listings_video").on(table.videoId),
    index("idx_video_listings_listing").on(table.listingId),
  ],
);
```

- [ ] **Step 2: Generate + migrate**

```bash
pnpm --filter @sabong/api db:generate
pnpm --filter @sabong/api db:migrate
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/database/
git commit -m "feat(reels): video_listings join table for shoppable reels"
```

---

### Task 10: Shoppable Reels Backend

**Files:**
- Modify: `apps/api/src/modules/videos/videos.service.ts` (add `tagListings`, `untagListing`, include tagged listings on `getVideo`)
- Modify: `apps/api/src/modules/videos/videos.controller.ts` (add endpoints)
- Create: `apps/api/src/modules/videos/dto/tag-listings.dto.ts`

- [ ] **Step 1: DTO**

```typescript
// dto/tag-listings.dto.ts
import { IsArray, IsUUID, ArrayMaxSize } from "class-validator";

export class TagListingsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  @ArrayMaxSize(5)
  listingIds!: string[];
}
```

- [ ] **Step 2: Service methods**

```typescript
async tagListings(videoId: string, userId: string, listingIds: string[]) {
  const video = await this.db.query.videos.findFirst({
    where: eq(videos.id, videoId),
  });
  if (!video) throw new NotFoundException();
  if (video.userId !== userId) throw new ForbiddenException();

  // Verify all listings belong to user
  const userListings = await this.db
    .select({ id: listings.id })
    .from(listings)
    .where(
      and(
        inArray(listings.id, listingIds),
        eq(listings.sellerId, userId),
      ),
    );
  if (userListings.length !== listingIds.length) {
    throw new ForbiddenException("Can only tag your own listings");
  }

  // Clear existing + reinsert
  await this.db
    .delete(videoListings)
    .where(eq(videoListings.videoId, videoId));
  if (listingIds.length > 0) {
    await this.db.insert(videoListings).values(
      listingIds.map((lid, i) => ({
        videoId,
        listingId: lid,
        displayOrder: i,
      })),
    );
  }

  return { tagged: listingIds.length };
}

async getVideoWithListings(videoId: string) {
  const video = await this.db.query.videos.findFirst({
    where: eq(videos.id, videoId),
  });
  if (!video) throw new NotFoundException();

  const tagged = await this.db
    .select({
      videoListing: videoListings,
      listing: listings,
    })
    .from(videoListings)
    .innerJoin(listings, eq(listings.id, videoListings.listingId))
    .where(eq(videoListings.videoId, videoId))
    .orderBy(asc(videoListings.displayOrder));

  return {
    ...video,
    taggedListings: tagged.map((t) => ({
      ...t.listing,
      displayOrder: t.videoListing.displayOrder,
    })),
  };
}

async trackShopClick(videoId: string, listingId: string) {
  await this.db
    .update(videoListings)
    .set({ clickCount: sql`${videoListings.clickCount} + 1` })
    .where(
      and(
        eq(videoListings.videoId, videoId),
        eq(videoListings.listingId, listingId),
      ),
    );
}
```

- [ ] **Step 3: Controller endpoints**

```typescript
@Post(":id/tag-listings")
tag(
  @Param("id") videoId: string,
  @CurrentUser() me: any,
  @Body() dto: TagListingsDto,
) {
  return this.videosService.tagListings(videoId, me.id, dto.listingIds);
}

@Post(":id/listings/:listingId/click")
trackClick(
  @Param("id") videoId: string,
  @Param("listingId") listingId: string,
) {
  return this.videosService.trackShopClick(videoId, listingId);
}
```

- [ ] **Step 4: Update feed endpoint to include tagged listings summary**

In the feed list query, join videoListings and return a `taggedListingCount` per video so the UI knows whether to show the shop pill.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/videos/
git commit -m "feat(reels): tag listings + track shop clicks"
```

---

### Task 11: Shoppable Reels UI (Web)

**Files:**
- Modify: `apps/web/src/app/(main)/feed/page.tsx`
- Create: `apps/web/src/components/feed/ShopPill.tsx`
- Create: `apps/web/src/components/feed/ShopSheet.tsx`
- Modify: `apps/web/src/app/(dashboard)/videos/new/page.tsx` (tag picker during upload)

- [ ] **Step 1: ShopPill component — floating button on video**

```tsx
// apps/web/src/components/feed/ShopPill.tsx
"use client";
export function ShopPill({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  if (count === 0) return null;
  return (
    <button
      onClick={onClick}
      className="absolute bottom-24 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-4 py-2 shadow-xl flex items-center gap-2 animate-bounce"
    >
      🛒 {count} birds for sale
    </button>
  );
}
```

- [ ] **Step 2: ShopSheet — slide-up sheet with tagged listings**

Use Radix `Dialog` or `@headlessui/react`. Render tagged listings as cards with "Buy" + "Save" buttons. On click, track shop click via API.

- [ ] **Step 3: Tag listings during upload**

Add a "Tag your birds" step after video upload. Query user's listings, show multi-select. Submit with video ID on save.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): shoppable reels — shop pill, sheet, tag picker"
```

---

### Task 12: Shoppable Reels UI (Mobile)

**Files:**
- Modify: `apps/mobile/app/(tabs)/feed.tsx`
- Create: `apps/mobile/components/feed/ShopPillMobile.tsx`
- Create: `apps/mobile/components/feed/ShopSheetMobile.tsx`
- Create: `apps/mobile/app/video/tag-listings.tsx` (post-upload tag step)

- [ ] **Step 1: ShopPillMobile**

```tsx
import { Pressable, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function ShopPillMobile({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  if (count === 0) return null;
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        bottom: 120,
        right: 16,
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={["#f97316", "#ef4444"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 16, paddingVertical: 8 }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          🛒 {count} for sale
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
```

- [ ] **Step 2: Bottom sheet with tagged listings**

Use `@gorhom/bottom-sheet` snap to 50%. List tagged listings with horizontal scroll. Tap → navigate to `/listing/[slug]` and track click.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/
git commit -m "feat(mobile): shoppable reels — shop pill + bottom sheet"
```

---

### Task 13: Demo Seed Data for Phase 1

**Files:**
- Modify: `apps/api/src/database/seed-demo/index.ts` (or wherever the seed lives)
- Add: friend relationships, group chats, DMs, tagged reels, voice notes

- [ ] **Step 1: Seed friend relationships**

Create friendships between demo users:
- Pedro ↔ Reylyn (accepted)
- Mang Tomas ↔ Pedro (accepted)
- Kelso Farm ↔ Mang Tomas (accepted)
- Sabungero Mike → Mang Tomas (pending, Mike sent the request)

- [ ] **Step 2: Seed DMs with messages**

Create a DM between Pedro and Mang Tomas with sample messages including:
- Text messages
- 1 voice note (upload a sample audio file)
- 1 listing share
- 1 reply thread

- [ ] **Step 3: Seed group chat**

"Kelso Bloodline Circle" group with Mang Tomas (owner), Pedro, Reylyn, Kelso Farm PH as members. 10-15 messages of Taglish chatter.

- [ ] **Step 4: Tag listings in existing seeded videos**

For each video in the feed, tag 1-3 of the creator's listings.

- [ ] **Step 5: Run seed script + verify**

```bash
pnpm --filter @sabong/api db:seed:demo
```

Verify: `/conversations` for Pedro returns multiple chats, `/friends` returns expected friends, feed videos show `taggedListingCount`.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/database/seed-demo/
git commit -m "chore(demo): seed friends, DMs, group chats, shoppable reel tags"
```

---

### Task 14: Phase 1 Smoke Test + Pitch Rehearsal

- [ ] **Step 1: Full end-to-end smoke**

- Start API + web + mobile.
- Log in as Pedro on web → verify:
  - Messages page shows group chat + DMs
  - Feed shows videos with 🛒 pills
  - Clicking pill opens sheet with tagged birds
  - Clicking bird navigates to listing
  - Friends tab shows existing friends + pending requests
- Log in on mobile as Pedro → verify same.
- Send a new friend request from Pedro to an unseeded user → verify notification.
- Voice-note in a DM → verify plays back on both web and mobile.
- React to a message → verify real-time WS update on the other client.

- [ ] **Step 2: Record a 90-second pitch demo video**

Screen-capture from Chrome showing the Phase 1 flows:
1. Feed → shop pill → sheet → listing (20s)
2. Messages → voice note send → reaction → typing indicator (25s)
3. Friends → suggestions → send request → accept on other account (25s)
4. Group chat with live messages (20s)

Save to `docs/pitch/phase1-demo.mov`.

- [ ] **Step 3: Commit**

```bash
git add docs/pitch/
git commit -m "docs(pitch): phase 1 demo recording"
```

---

## Chunk 2: Phase 2 — Community (Groups + Stories)

**Scope:** Once messaging + graph are live, layer on FB-style Groups and IG-style Stories.

**Tasks (outline — expand into a separate plan doc before executing):**

1. **Groups schema** (`groups`, `group_members`, `group_posts`, `group_comments`)
2. **Groups backend module** (create/join/leave, post/comment, moderation)
3. **Seed groups** (Kelso Nation, Pampanga Sabungeros, Regional groups)
4. **Groups web UI** (list, detail, feed, join/leave, admin tools)
5. **Groups mobile UI** (same)
6. **Stories schema** (`stories` with 24h TTL)
7. **Stories backend** (create, view, auto-expire cron)
8. **Stories web UI** (ring row above home feed, viewer, reply-via-DM)
9. **Stories mobile UI** (same)
10. **Seed stories** (demo farm updates from Mang Tomas, Kelso Farm)
11. **Phase 2 smoke test**

**Estimate:** ~10 hours. Generate full plan doc before execution.

---

## Chunk 3: Phase 3 — BloodlineLIVE (Optional)

**Scope:** Live streaming with HLS playback, real-time chat, tip/reaction overlay, auction countdown integration.

**Tasks (outline):**

1. **Live streams schema** (`live_streams` with HLS URL, status, viewer count)
2. **Live backend module** (start/stop, viewer join/leave pub-sub)
3. **Mock stream infrastructure** — pre-recorded video as "live" for demo
4. **Live web UI** — HLS.js playback, live chat overlay, tips
5. **Live mobile UI** — expo-video playback, live chat
6. **Live auction integration** — flash auction runs inside live stream
7. **Seed demo** — scheduled "Mang Tomas Live Auction" with recorded footage
8. **Phase 3 smoke test**

**Estimate:** ~8 hours. Mock-demo-friendly. Generate full plan before execution.

---

## Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Migration conflicts on existing `conversations` table | Add `type='listing'` default + backfill `chat_participants` for all existing rows. Keep old legacy columns nullable but still present. |
| WebSocket scaling (typing + reactions broadcast) | Demo scale is fine with single-node Socket.IO. Plan Redis adapter for production. |
| Voice note storage costs | Local disk for MVP demo (same as images). Migrate to R2 before real launch. |
| Spam via universal DMs | Message Requests folder (non-friends go there) + rate limit (handled later in production hardening). |
| Friend request abuse | Block endpoint + moderation tools in admin panel (already exists). |

---

## Out of Scope for Phase 1

Explicitly NOT in this plan (save for later):
- Message encryption / E2E
- Read-receipt privacy settings
- Story highlights / pinning
- Paid DMs / creator monetization
- Hashtag discovery
- Ads infrastructure
- Push notifications via APNs/FCM (use in-app notifications only)
- Rate limiting / abuse throttling
- Analytics dashboards for creators

---

## Success Criteria

Phase 1 ships when:
- [ ] Any user can send/accept/decline friend requests (web + mobile)
- [ ] Any user can start a DM with any other user (subject to privacy)
- [ ] Group chats of up to 30 members work with voice notes + reactions + typing
- [ ] Creators can tag listings in their videos; viewers see shop pill + sheet
- [ ] Demo seed provides enough data for 90-second pitch video
- [ ] All pitch flows green on both web and mobile
- [ ] No regressions in existing flows (orders, listings, reviews)

---

**Plan length:** ~1400 lines. Chunks 1, 2, 3 delimited above.

**Status:** Chunk 1 (Phase 1) is fully detailed and ready for execution. Chunks 2 and 3 are outlined; produce expanded plan documents before starting those phases.
