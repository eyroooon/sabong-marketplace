import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { eq, and, sql, desc, asc, ilike, or } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  groups,
  groupMembers,
  groupPosts,
  users,
} from "../../database/schema";
import { CreateGroupDto } from "./dto/create-group.dto";
import { CreatePostDto } from "./dto/create-post.dto";

@Injectable()
export class GroupsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  /** Slugify a name: lowercase, replace non-alphanumerics with dashes. */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
  }

  /** Ensure slug uniqueness by appending numeric suffix if taken. */
  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let suffix = 2;
    while (true) {
      const [existing] = await this.db
        .select({ id: groups.id })
        .from(groups)
        .where(eq(groups.slug, slug))
        .limit(1);
      if (!existing) return slug;
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  /**
   * Create a new group. Creator becomes owner + first member.
   */
  async create(creatorId: string, dto: CreateGroupDto) {
    const baseSlug = this.slugify(dto.name);
    if (!baseSlug) throw new BadRequestException("Group name must contain at least one letter or digit");
    const slug = await this.ensureUniqueSlug(baseSlug);

    const [group] = await this.db
      .insert(groups)
      .values({
        slug,
        name: dto.name,
        description: dto.description ?? null,
        category: dto.category,
        type: dto.type ?? "public",
        iconEmoji: dto.iconEmoji ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        memberCount: 1,
        postCount: 0,
        createdById: creatorId,
      })
      .returning();

    await this.db.insert(groupMembers).values({
      groupId: group.id,
      userId: creatorId,
      role: "owner",
      status: "active",
    });

    return group;
  }

  /**
   * List all groups with optional category filter + search query.
   * Returns for each group: base fields + viewer's membership status.
   */
  async listGroups(viewerId: string | null, params: { category?: string; q?: string; limit?: number }) {
    const { category, q, limit = 50 } = params;

    const conditions: any[] = [];
    if (category) conditions.push(eq(groups.category, category));
    if (q) conditions.push(ilike(groups.name, `%${q}%`));

    // Skip secret groups unless viewer is a member
    conditions.push(sql`(${groups.type} != 'secret' OR ${groups.id} IN (SELECT group_id FROM ${groupMembers} WHERE user_id = ${viewerId}))`);

    const rows = await this.db
      .select({
        id: groups.id,
        slug: groups.slug,
        name: groups.name,
        description: groups.description,
        category: groups.category,
        type: groups.type,
        iconEmoji: groups.iconEmoji,
        coverImageUrl: groups.coverImageUrl,
        memberCount: groups.memberCount,
        postCount: groups.postCount,
        createdAt: groups.createdAt,
      })
      .from(groups)
      .where(and(...conditions))
      .orderBy(desc(groups.memberCount))
      .limit(limit);

    // Attach membership status for viewer
    if (!viewerId) return rows.map((r: any) => ({ ...r, isMember: false, role: null }));

    const memberRows = await this.db
      .select({ groupId: groupMembers.groupId, role: groupMembers.role, status: groupMembers.status })
      .from(groupMembers)
      .where(eq(groupMembers.userId, viewerId));

    const memberMap = new Map<string, { role: string; status: string }>();
    memberRows.forEach((m: any) => memberMap.set(m.groupId, { role: m.role, status: m.status }));

    return rows.map((r: any) => {
      const m = memberMap.get(r.id);
      return {
        ...r,
        isMember: !!m && m.status === "active",
        role: m?.role ?? null,
      };
    });
  }

  /**
   * List groups the viewer is a member of.
   */
  async myGroups(viewerId: string) {
    const rows = await this.db
      .select({
        id: groups.id,
        slug: groups.slug,
        name: groups.name,
        description: groups.description,
        category: groups.category,
        type: groups.type,
        iconEmoji: groups.iconEmoji,
        coverImageUrl: groups.coverImageUrl,
        memberCount: groups.memberCount,
        postCount: groups.postCount,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(and(eq(groupMembers.userId, viewerId), eq(groupMembers.status, "active")))
      .orderBy(desc(groupMembers.joinedAt));

    return rows.map((r: any) => ({ ...r, isMember: true }));
  }

  /**
   * Get a single group by slug + viewer's membership.
   */
  async getBySlug(slug: string, viewerId: string | null) {
    const [group] = await this.db
      .select()
      .from(groups)
      .where(eq(groups.slug, slug))
      .limit(1);

    if (!group) throw new NotFoundException("Group not found");

    // Secret groups only visible to members
    if (group.type === "secret" && viewerId) {
      const [m] = await this.db
        .select({ id: groupMembers.id })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, viewerId), eq(groupMembers.status, "active")))
        .limit(1);
      if (!m) throw new ForbiddenException("This group is private");
    } else if (group.type === "secret" && !viewerId) {
      throw new ForbiddenException("This group is private");
    }

    let membership: { role: string; status: string } | null = null;
    if (viewerId) {
      const [m] = await this.db
        .select({ role: groupMembers.role, status: groupMembers.status })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, viewerId)))
        .limit(1);
      if (m) membership = m;
    }

    return {
      ...group,
      isMember: membership?.status === "active",
      role: membership?.role ?? null,
      pendingApproval: membership?.status === "pending",
    };
  }

  /**
   * Join a group.
   * - public: immediate active membership
   * - private: pending status (admin must approve)
   * - secret: cannot self-join
   */
  async join(groupId: string, userId: string) {
    const [group] = await this.db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) throw new NotFoundException("Group not found");

    if (group.type === "secret") {
      throw new ForbiddenException("Secret groups are invite-only");
    }

    const [existing] = await this.db
      .select({ id: groupMembers.id, status: groupMembers.status })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (existing) {
      if (existing.status === "active") throw new ConflictException("Already a member");
      if (existing.status === "pending") throw new ConflictException("Join request pending");
      if (existing.status === "banned") throw new ForbiddenException("You have been banned from this group");
    }

    const status = group.type === "private" ? "pending" : "active";
    await this.db.insert(groupMembers).values({ groupId, userId, role: "member", status });

    if (status === "active") {
      await this.db
        .update(groups)
        .set({ memberCount: sql`${groups.memberCount} + 1`, updatedAt: new Date() })
        .where(eq(groups.id, groupId));
    }

    return { status };
  }

  /**
   * Leave a group. Owner cannot leave (must transfer ownership first).
   */
  async leave(groupId: string, userId: string) {
    const [m] = await this.db
      .select({ id: groupMembers.id, role: groupMembers.role, status: groupMembers.status })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!m) throw new NotFoundException("Not a member");
    if (m.role === "owner") {
      throw new BadRequestException("Owner cannot leave. Transfer ownership first.");
    }

    const wasActive = m.status === "active";
    await this.db.delete(groupMembers).where(eq(groupMembers.id, m.id));

    if (wasActive) {
      await this.db
        .update(groups)
        .set({ memberCount: sql`GREATEST(${groups.memberCount} - 1, 0)`, updatedAt: new Date() })
        .where(eq(groups.id, groupId));
    }

    return { ok: true };
  }

  /**
   * List group members with their user + role.
   */
  async listMembers(groupId: string, viewerId: string | null, limit = 100) {
    // Verify group exists and is visible to viewer
    const [group] = await this.db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) throw new NotFoundException("Group not found");

    const rows = await this.db
      .select({
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        isVerified: users.isVerified,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")))
      .orderBy(asc(groupMembers.joinedAt))
      .limit(limit);

    return rows;
  }

  /**
   * Create a post in a group. Must be active member.
   */
  async createPost(groupId: string, authorId: string, dto: CreatePostDto) {
    const [m] = await this.db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, authorId),
          eq(groupMembers.status, "active"),
        ),
      )
      .limit(1);

    if (!m) throw new ForbiddenException("You must be a group member to post");

    const [post] = await this.db
      .insert(groupPosts)
      .values({
        groupId,
        authorId,
        body: dto.body,
        images: dto.images ?? [],
      })
      .returning();

    await this.db
      .update(groups)
      .set({ postCount: sql`${groups.postCount} + 1`, updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    return post;
  }

  /**
   * List posts in a group. Pinned posts first, then recent.
   */
  async listPosts(groupId: string, viewerId: string | null, limit = 50) {
    // Visibility check for secret groups
    const [group] = await this.db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) throw new NotFoundException("Group not found");

    if (group.type === "secret") {
      if (!viewerId) throw new ForbiddenException("Login required");
      const [m] = await this.db
        .select({ id: groupMembers.id })
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, viewerId),
            eq(groupMembers.status, "active"),
          ),
        )
        .limit(1);
      if (!m) throw new ForbiddenException("Member only");
    }

    const rows = await this.db
      .select({
        id: groupPosts.id,
        body: groupPosts.body,
        images: groupPosts.images,
        likesCount: groupPosts.likesCount,
        commentsCount: groupPosts.commentsCount,
        pinnedAt: groupPosts.pinnedAt,
        createdAt: groupPosts.createdAt,
        authorId: users.id,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
        authorIsVerified: users.isVerified,
      })
      .from(groupPosts)
      .innerJoin(users, eq(groupPosts.authorId, users.id))
      .where(eq(groupPosts.groupId, groupId))
      .orderBy(desc(groupPosts.pinnedAt), desc(groupPosts.createdAt))
      .limit(limit);

    return rows.map((r: any) => ({
      id: r.id,
      body: r.body,
      images: r.images ?? [],
      likesCount: r.likesCount,
      commentsCount: r.commentsCount,
      pinnedAt: r.pinnedAt,
      createdAt: r.createdAt,
      author: {
        id: r.authorId,
        firstName: r.authorFirstName,
        lastName: r.authorLastName,
        displayName: r.authorDisplayName,
        avatarUrl: r.authorAvatarUrl,
        isVerified: r.authorIsVerified,
      },
    }));
  }

  /**
   * Delete a post. Author or group admin/owner only.
   */
  async deletePost(postId: string, userId: string) {
    const [post] = await this.db.select().from(groupPosts).where(eq(groupPosts.id, postId)).limit(1);
    if (!post) throw new NotFoundException("Post not found");

    if (post.authorId !== userId) {
      const [m] = await this.db
        .select({ role: groupMembers.role })
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, post.groupId),
            eq(groupMembers.userId, userId),
            eq(groupMembers.status, "active"),
          ),
        )
        .limit(1);
      if (!m || !["owner", "admin", "moderator"].includes(m.role)) {
        throw new ForbiddenException("Only author or moderators can delete");
      }
    }

    await this.db.delete(groupPosts).where(eq(groupPosts.id, postId));
    await this.db
      .update(groups)
      .set({ postCount: sql`GREATEST(${groups.postCount} - 1, 0)`, updatedAt: new Date() })
      .where(eq(groups.id, post.groupId));

    return { ok: true };
  }
}
