import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { conversations, messages, users } from "../../database/schema";

import { MessagesGateway } from "./messages.gateway";

@Injectable()
export class MessagesService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private gateway: MessagesGateway,
  ) {}

  async getConversations(userId: string) {
    const data = await this.db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.buyerId, userId), eq(conversations.isArchivedBuyer, false)),
          and(eq(conversations.sellerId, userId), eq(conversations.isArchivedSeller, false)),
        ),
      )
      .orderBy(desc(conversations.lastMessageAt));

    // Enrich with user names
    const enriched = await Promise.all(
      data.map(async (conv: any) => {
        const otherUserId =
          conv.buyerId === userId ? conv.sellerId : conv.buyerId;
        const [otherUser] = await this.db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        const unreadCount =
          conv.buyerId === userId
            ? conv.buyerUnreadCount
            : conv.sellerUnreadCount;

        return { ...conv, otherUser, unreadCount };
      }),
    );

    return { data: enriched };
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    // Verify access
    const conv = await this.verifyAccess(conversationId, userId);

    const offset = (page - 1) * limit;

    const data = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Mark as read
    if (conv.buyerId === userId && conv.buyerUnreadCount > 0) {
      await this.db
        .update(conversations)
        .set({ buyerUnreadCount: 0, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    } else if (conv.sellerId === userId && conv.sellerUnreadCount > 0) {
      await this.db
        .update(conversations)
        .set({ sellerUnreadCount: 0, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    return { data: data.reverse(), conversation: conv };
  }

  async startConversation(
    buyerId: string,
    sellerId: string,
    listingId: string,
    initialMessage: string,
  ) {
    // Check if conversation already exists
    const [existing] = await this.db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.buyerId, buyerId),
          eq(conversations.sellerId, sellerId),
          eq(conversations.listingId, listingId),
        ),
      )
      .limit(1);

    if (existing) {
      // Send message to existing conversation
      await this.sendMessage(existing.id, buyerId, initialMessage);
      return { conversationId: existing.id, isNew: false };
    }

    // Create new conversation
    const [conv] = await this.db
      .insert(conversations)
      .values({
        listingId,
        buyerId,
        sellerId,
        lastMessageAt: new Date(),
        lastMessagePreview: initialMessage.slice(0, 200),
        sellerUnreadCount: 1,
      })
      .returning();

    // Create the first message
    const [firstMessage] = await this.db
      .insert(messages)
      .values({
        conversationId: conv.id,
        senderId: buyerId,
        content: initialMessage,
        messageType: "text",
      })
      .returning();

    // Notify seller about new conversation via WebSocket
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

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: string = "text",
    offerAmount?: number,
  ) {
    const conv = await this.verifyAccess(conversationId, senderId);

    const [message] = await this.db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
        messageType,
        offerAmount: offerAmount?.toString(),
        offerStatus: messageType === "offer" ? "pending" : undefined,
      })
      .returning();

    // Update conversation metadata
    const isBuyer = conv.buyerId === senderId;
    await this.db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: content.slice(0, 200),
        ...(isBuyer
          ? { sellerUnreadCount: sql`${conversations.sellerUnreadCount} + 1` }
          : { buyerUnreadCount: sql`${conversations.buyerUnreadCount} + 1` }),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    // Emit real-time WebSocket events
    const recipientId = isBuyer ? conv.sellerId : conv.buyerId;
    this.gateway.sendMessageToConversation(conversationId, {
      id: message.id,
      conversationId,
      senderId,
      content,
      messageType,
      createdAt: message.createdAt,
    });
    this.gateway.sendToUser(recipientId, "conversationUpdated", {
      conversationId,
      lastMessage: content,
    });

    return message;
  }

  async markAsRead(conversationId: string, userId: string) {
    const conv = await this.verifyAccess(conversationId, userId);

    if (conv.buyerId === userId) {
      await this.db
        .update(conversations)
        .set({ buyerUnreadCount: 0, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    } else {
      await this.db
        .update(conversations)
        .set({ sellerUnreadCount: 0, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    return { message: "Marked as read" };
  }

  private async verifyAccess(conversationId: string, userId: string) {
    const [conv] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv) {
      throw new NotFoundException("Conversation not found");
    }

    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      throw new ForbiddenException("You do not have access to this conversation");
    }

    return conv;
  }
}
