import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  conversations,
  messages,
  users,
  chatParticipants,
  messageReactions,
  friendships,
} from "../../database/schema";

import { MessagesGateway } from "./messages.gateway";

/**
 * Polymorphic chat service.
 *
 * Authoritative membership lives in `chat_participants` — every listing chat,
 * DM, and group inserts rows there. Legacy listing unread counters on
 * conversations are kept in sync for backward compat but are no longer
 * the source of truth.
 */
@Injectable()
export class MessagesService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private gateway: MessagesGateway,
  ) {}

  // ────────────────────────────────────────────────────────────
  // Conversation listing (unified across listing / DM / group)
  // ────────────────────────────────────────────────────────────

  async getConversations(userId: string) {
    // Get all conversations this user is a participant in via chat_participants
    const rows = await this.db
      .select({
        conversation: conversations,
        participant: chatParticipants,
      })
      .from(chatParticipants)
      .innerJoin(
        conversations,
        eq(conversations.id, chatParticipants.conversationId),
      )
      .where(
        and(
          eq(chatParticipants.userId, userId),
          eq(chatParticipants.isArchived, false),
        ),
      )
      .orderBy(desc(conversations.lastMessageAt));

    // Enrich each row with the "other user" for DMs/listings, or group metadata
    const enriched = await Promise.all(
      rows.map(async (row: any) => {
        const conv = row.conversation;
        const participant = row.participant;

        let otherUser = null;
        let participantCount = 0;

        if (conv.type === "listing" || conv.type === "dm") {
          // For DM, the other user might not be in the legacy buyerId/sellerId
          // Find the other participant via chat_participants.
          const otherRow = await this.db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              displayName: users.displayName,
              avatarUrl: users.avatarUrl,
            })
            .from(chatParticipants)
            .innerJoin(users, eq(users.id, chatParticipants.userId))
            .where(
              and(
                eq(chatParticipants.conversationId, conv.id),
                sql`${chatParticipants.userId} != ${userId}`,
              ),
            )
            .limit(1);
          otherUser = otherRow[0] || null;
        } else if (conv.type === "group") {
          // Count members for display
          const [countRow] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(chatParticipants)
            .where(eq(chatParticipants.conversationId, conv.id));
          participantCount = Number(countRow?.count || 0);
        }

        return {
          ...conv,
          otherUser,
          participantCount,
          unreadCount: participant.unreadCount,
          role: participant.role,
          isMuted: participant.isMuted,
        };
      }),
    );

    return { data: enriched };
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50,
  ) {
    const conv = await this.verifyAccess(conversationId, userId);

    const offset = (page - 1) * limit;

    const msgs = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch reactions for these messages
    const messageIds = msgs.map((m: any) => m.id);
    let reactionRows: any[] = [];
    if (messageIds.length > 0) {
      reactionRows = await this.db
        .select()
        .from(messageReactions)
        .where(inArray(messageReactions.messageId, messageIds));
    }

    // Group reactions per message: { messageId: { emoji: { count, userIds } } }
    const reactionsByMessage: Record<string, any> = {};
    for (const r of reactionRows) {
      if (!reactionsByMessage[r.messageId]) {
        reactionsByMessage[r.messageId] = {};
      }
      if (!reactionsByMessage[r.messageId][r.emoji]) {
        reactionsByMessage[r.messageId][r.emoji] = { count: 0, userIds: [] };
      }
      reactionsByMessage[r.messageId][r.emoji].count++;
      reactionsByMessage[r.messageId][r.emoji].userIds.push(r.userId);
    }

    const msgsWithReactions = msgs.map((m: any) => ({
      ...m,
      reactions: reactionsByMessage[m.id] || {},
    }));

    // Mark conversation as read for this user (reset unread in chat_participants)
    await this.markAsRead(conversationId, userId);

    return { data: msgsWithReactions.reverse(), conversation: conv };
  }

  // ────────────────────────────────────────────────────────────
  // Listing-scoped chat (legacy, backward compat)
  // ────────────────────────────────────────────────────────────

  async startConversation(
    buyerId: string,
    sellerId: string,
    listingId: string,
    initialMessage: string,
  ) {
    // Check if listing conversation already exists
    const [existing] = await this.db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.type, "listing"),
          eq(conversations.buyerId, buyerId),
          eq(conversations.sellerId, sellerId),
          eq(conversations.listingId, listingId),
        ),
      )
      .limit(1);

    if (existing) {
      await this.sendMessage(existing.id, buyerId, initialMessage);
      return { conversationId: existing.id, isNew: false };
    }

    const [conv] = await this.db
      .insert(conversations)
      .values({
        type: "listing",
        listingId,
        buyerId,
        sellerId,
        createdById: buyerId,
        lastMessageAt: new Date(),
        lastMessagePreview: initialMessage.slice(0, 200),
        sellerUnreadCount: 1,
      })
      .returning();

    // Insert chat_participants for both parties
    await this.db.insert(chatParticipants).values([
      { conversationId: conv.id, userId: buyerId, role: "member" },
      {
        conversationId: conv.id,
        userId: sellerId,
        role: "member",
        unreadCount: 1,
      },
    ]);

    const [firstMessage] = await this.db
      .insert(messages)
      .values({
        conversationId: conv.id,
        senderId: buyerId,
        content: initialMessage,
        messageType: "text",
      })
      .returning();

    this.gateway.sendToUser(sellerId, "newConversation", {
      conversationId: conv.id,
    });
    this.gateway.sendMessageToConversation(conv.id, {
      id: firstMessage.id,
      conversationId: conv.id,
      senderId: buyerId,
      content: initialMessage,
      messageType: "text",
      createdAt: firstMessage.createdAt,
    });

    return { conversationId: conv.id, isNew: true };
  }

  // ────────────────────────────────────────────────────────────
  // DM (1:1 non-listing)
  // ────────────────────────────────────────────────────────────

  async getOrCreateDm(currentUserId: string, otherUserId: string) {
    if (currentUserId === otherUserId) {
      throw new BadRequestException("Cannot DM yourself");
    }

    // Block check via friendships
    const [blocked] = await this.db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "blocked"),
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
        ),
      )
      .limit(1);
    if (blocked) {
      throw new ForbiddenException("Cannot message this user");
    }

    // Look for existing DM conversation where both users are participants
    const existingRows = await this.db
      .select({ conversationId: chatParticipants.conversationId })
      .from(chatParticipants)
      .innerJoin(
        conversations,
        eq(conversations.id, chatParticipants.conversationId),
      )
      .where(
        and(
          eq(conversations.type, "dm"),
          eq(chatParticipants.userId, currentUserId),
        ),
      );

    for (const row of existingRows) {
      const [otherPart] = await this.db
        .select()
        .from(chatParticipants)
        .where(
          and(
            eq(chatParticipants.conversationId, row.conversationId),
            eq(chatParticipants.userId, otherUserId),
          ),
        )
        .limit(1);
      if (otherPart) {
        return { conversationId: row.conversationId, created: false };
      }
    }

    // Create new DM conversation
    const [conv] = await this.db
      .insert(conversations)
      .values({
        type: "dm",
        createdById: currentUserId,
      })
      .returning();

    await this.db.insert(chatParticipants).values([
      { conversationId: conv.id, userId: currentUserId, role: "member" },
      { conversationId: conv.id, userId: otherUserId, role: "member" },
    ]);

    return { conversationId: conv.id, created: true };
  }

  // ────────────────────────────────────────────────────────────
  // Group chats
  // ────────────────────────────────────────────────────────────

  async createGroup(
    creatorId: string,
    title: string,
    memberUserIds: string[],
  ) {
    const cleaned = Array.from(
      new Set(memberUserIds.filter((id) => id !== creatorId)),
    );
    if (cleaned.length < 1) {
      throw new BadRequestException(
        "Group needs at least 1 other member besides yourself",
      );
    }
    if (cleaned.length > 29) {
      throw new BadRequestException("Max 30 members per group");
    }
    if (!title || title.trim().length < 1) {
      throw new BadRequestException("Group title required");
    }

    const [conv] = await this.db
      .insert(conversations)
      .values({
        type: "group",
        title: title.trim().slice(0, 100),
        createdById: creatorId,
      })
      .returning();

    await this.db.insert(chatParticipants).values([
      { conversationId: conv.id, userId: creatorId, role: "owner" },
      ...cleaned.map((uid) => ({
        conversationId: conv.id,
        userId: uid,
        role: "member",
      })),
    ]);

    // System message announcing the group creation
    const [creator] = await this.db
      .select({
        firstName: users.firstName,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, creatorId))
      .limit(1);
    const creatorName =
      creator?.displayName || creator?.firstName || "Someone";
    await this.db.insert(messages).values({
      conversationId: conv.id,
      senderId: creatorId,
      content: `${creatorName} created the group`,
      messageType: "system",
    });

    return { conversationId: conv.id };
  }

  async addGroupMembers(
    conversationId: string,
    actorId: string,
    userIds: string[],
  ) {
    const [conv] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (!conv) throw new NotFoundException("Conversation not found");
    if (conv.type !== "group") {
      throw new BadRequestException("Only group chats support adding members");
    }
    // Actor must be owner or admin
    const [actorPart] = await this.db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.conversationId, conversationId),
          eq(chatParticipants.userId, actorId),
        ),
      )
      .limit(1);
    if (!actorPart || !["owner", "admin"].includes(actorPart.role)) {
      throw new ForbiddenException("Only owners/admins can add members");
    }

    const cleaned = Array.from(new Set(userIds.filter((id) => !!id)));
    if (cleaned.length === 0) return { added: 0 };

    // Insert new participants; ignore conflicts for already-present users
    const rows = cleaned.map((uid) => ({
      conversationId,
      userId: uid,
      role: "member",
    }));
    try {
      await this.db.insert(chatParticipants).values(rows);
    } catch (err: any) {
      // PG unique violation on already-members — ignore
      if (err?.code !== "23505") throw err;
    }

    return { added: cleaned.length };
  }

  async leaveGroup(conversationId: string, userId: string) {
    const [conv] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (!conv) throw new NotFoundException();
    if (conv.type !== "group") {
      throw new BadRequestException("Only groups can be left");
    }
    await this.db
      .delete(chatParticipants)
      .where(
        and(
          eq(chatParticipants.conversationId, conversationId),
          eq(chatParticipants.userId, userId),
        ),
      );
    return { ok: true };
  }

  // ────────────────────────────────────────────────────────────
  // Messaging (unified send with rich media + replies)
  // ────────────────────────────────────────────────────────────

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: string = "text",
    extras?: {
      offerAmount?: number;
      mediaUrl?: string;
      mediaDurationMs?: number;
      mediaWidth?: number;
      mediaHeight?: number;
      replyToMessageId?: string;
      attachedListingId?: string;
      attachedVideoId?: string;
    },
  ) {
    const conv = await this.verifyAccess(conversationId, senderId);

    const [message] = await this.db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
        messageType,
        offerAmount: extras?.offerAmount?.toString(),
        offerStatus: messageType === "offer" ? "pending" : undefined,
        mediaUrl: extras?.mediaUrl,
        mediaDurationMs: extras?.mediaDurationMs,
        mediaWidth: extras?.mediaWidth,
        mediaHeight: extras?.mediaHeight,
        replyToMessageId: extras?.replyToMessageId,
        attachedListingId: extras?.attachedListingId,
        attachedVideoId: extras?.attachedVideoId,
      })
      .returning();

    // Bump unread counts for all participants except the sender
    await this.db
      .update(chatParticipants)
      .set({ unreadCount: sql`${chatParticipants.unreadCount} + 1` })
      .where(
        and(
          eq(chatParticipants.conversationId, conversationId),
          sql`${chatParticipants.userId} != ${senderId}`,
        ),
      );

    // Keep legacy listing counters in sync for backward compat
    if (conv.type === "listing") {
      const isBuyer = conv.buyerId === senderId;
      await this.db
        .update(conversations)
        .set({
          lastMessageAt: new Date(),
          lastMessagePreview: (content || messageType).slice(0, 200),
          ...(isBuyer
            ? { sellerUnreadCount: sql`${conversations.sellerUnreadCount} + 1` }
            : { buyerUnreadCount: sql`${conversations.buyerUnreadCount} + 1` }),
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));
    } else {
      await this.db
        .update(conversations)
        .set({
          lastMessageAt: new Date(),
          lastMessagePreview: (content || messageType).slice(0, 200),
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));
    }

    // WebSocket emit
    this.gateway.sendMessageToConversation(conversationId, {
      id: message.id,
      conversationId,
      senderId,
      content: message.content,
      messageType: message.messageType,
      mediaUrl: message.mediaUrl,
      mediaDurationMs: message.mediaDurationMs,
      replyToMessageId: message.replyToMessageId,
      attachedListingId: message.attachedListingId,
      attachedVideoId: message.attachedVideoId,
      offerAmount: message.offerAmount,
      offerStatus: message.offerStatus,
      createdAt: message.createdAt,
    });

    // Per-user "conversation updated" push so their sidebar reflects new message
    const participants = await this.db
      .select({ userId: chatParticipants.userId })
      .from(chatParticipants)
      .where(eq(chatParticipants.conversationId, conversationId));
    for (const p of participants) {
      if (p.userId !== senderId) {
        this.gateway.sendToUser(p.userId, "conversationUpdated", {
          conversationId,
          lastMessage: content,
        });
      }
    }

    return message;
  }

  // ────────────────────────────────────────────────────────────
  // Reactions
  // ────────────────────────────────────────────────────────────

  async toggleReaction(userId: string, messageId: string, emoji: string) {
    if (!emoji || emoji.length > 8) {
      throw new BadRequestException("Invalid emoji");
    }

    const [message] = await this.db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);
    if (!message) throw new NotFoundException("Message not found");

    // Verify user has access to the conversation
    await this.verifyAccess(message.conversationId, userId);

    const [existing] = await this.db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji),
        ),
      )
      .limit(1);

    let action: "added" | "removed";
    if (existing) {
      await this.db
        .delete(messageReactions)
        .where(eq(messageReactions.id, existing.id));
      action = "removed";
    } else {
      await this.db.insert(messageReactions).values({
        messageId,
        userId,
        emoji,
      });
      action = "added";
    }

    // Broadcast reaction event
    this.gateway.sendMessageToConversation(message.conversationId, {
      type: "reactionUpdate",
      messageId,
      userId,
      emoji,
      action,
    });

    return { action };
  }

  // ────────────────────────────────────────────────────────────
  // Offer responses (kept from legacy)
  // ────────────────────────────────────────────────────────────

  async respondToOffer(
    messageId: string,
    userId: string,
    decision: "accept" | "reject" | "counter",
    newAmount?: number,
  ) {
    const [message] = await this.db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) throw new NotFoundException("Message not found");
    if (message.messageType !== "offer") {
      throw new BadRequestException("Not an offer message");
    }
    if (message.offerStatus !== "pending") {
      throw new BadRequestException("Offer already resolved");
    }

    const conv = await this.verifyAccess(message.conversationId, userId);
    if (message.senderId === userId) {
      throw new BadRequestException("You can't respond to your own offer");
    }

    const nextStatus =
      decision === "accept"
        ? "accepted"
        : decision === "reject"
          ? "rejected"
          : "countered";

    await this.db
      .update(messages)
      .set({ offerStatus: nextStatus })
      .where(eq(messages.id, messageId));

    const amountPhp = message.offerAmount
      ? `₱${Number(message.offerAmount).toLocaleString("en-PH")}`
      : "";
    let followUp = "";
    if (decision === "accept") {
      followUp = `✅ Accepted offer of ${amountPhp}. Proceed to checkout.`;
    } else if (decision === "reject") {
      followUp = `❌ Rejected offer of ${amountPhp}.`;
    } else {
      const counter = newAmount
        ? `₱${Number(newAmount).toLocaleString("en-PH")}`
        : "";
      followUp = `🔁 Countered ${amountPhp} with ${counter}`;
    }

    if (decision === "counter" && newAmount) {
      await this.sendMessage(message.conversationId, userId, followUp, "offer", {
        offerAmount: newAmount,
      });
    } else {
      await this.sendMessage(message.conversationId, userId, followUp, "text");
    }

    this.gateway.sendMessageToConversation(message.conversationId, {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      offerStatus: nextStatus,
      type: "offerUpdate",
    });
    void conv;

    return { message: "Offer response recorded", offerStatus: nextStatus };
  }

  // ────────────────────────────────────────────────────────────
  // Read receipts / typing
  // ────────────────────────────────────────────────────────────

  async markAsRead(conversationId: string, userId: string) {
    await this.db
      .update(chatParticipants)
      .set({ unreadCount: 0, lastReadAt: new Date() })
      .where(
        and(
          eq(chatParticipants.conversationId, conversationId),
          eq(chatParticipants.userId, userId),
        ),
      );

    // Keep legacy counter in sync if this is a listing chat
    const [conv] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (conv?.type === "listing") {
      if (conv.buyerId === userId) {
        await this.db
          .update(conversations)
          .set({ buyerUnreadCount: 0, updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));
      } else if (conv.sellerId === userId) {
        await this.db
          .update(conversations)
          .set({ sellerUnreadCount: 0, updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));
      }
    }

    // Broadcast read receipt to other participants
    this.gateway.sendMessageToConversation(conversationId, {
      type: "readReceipt",
      conversationId,
      userId,
      readAt: new Date().toISOString(),
    });

    return { message: "Marked as read" };
  }

  // ────────────────────────────────────────────────────────────
  // Access check — now via chat_participants (source of truth)
  // ────────────────────────────────────────────────────────────

  private async verifyAccess(conversationId: string, userId: string) {
    const [conv] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv) {
      throw new NotFoundException("Conversation not found");
    }

    const [participant] = await this.db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.conversationId, conversationId),
          eq(chatParticipants.userId, userId),
        ),
      )
      .limit(1);

    // Backward compat: if a legacy listing conversation somehow lacks a
    // chat_participants row, fall back to buyer/seller check.
    if (!participant) {
      if (
        conv.type === "listing" &&
        (conv.buyerId === userId || conv.sellerId === userId)
      ) {
        return conv;
      }
      throw new ForbiddenException(
        "You do not have access to this conversation",
      );
    }

    return conv;
  }
}
