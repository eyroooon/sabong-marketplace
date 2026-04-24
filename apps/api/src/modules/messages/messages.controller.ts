import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { MessagesService } from "./messages.service";
import {
  StartConversationDto,
  SendMessageDto,
  CreateDmDto,
  CreateGroupDto,
  ReactionDto,
  AddMembersDto,
} from "./dto/send-message.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SanitizePipe } from "../../common/pipes/sanitize.pipe";
import { StorageService } from "../../common/storage/storage.service";

const ALLOWED_CHAT_MEDIA_MIMES = [
  // Audio (voice notes)
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-m4a",
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // Video
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

@Controller("messages")
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private storageService: StorageService,
  ) {}

  @Get("conversations")
  getConversations(@CurrentUser("id") userId: string) {
    return this.messagesService.getConversations(userId);
  }

  /**
   * Upload chat media (voice note, image, video).
   * Client uploads the file, gets back a URL, then calls send-message with
   * mediaUrl + appropriate messageType.
   *
   * Limits: 25MB max. Allowed mimetypes: audio/*, image/*, video/*.
   */
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_CHAT_MEDIA_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Unsupported media type: ${file.mimetype}`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadChatMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    const folder = file.mimetype.startsWith("audio/")
      ? "audio"
      : file.mimetype.startsWith("video/")
        ? "videos"
        : "chat-media";
    const url = await this.storageService.uploadFile(file, folder);
    return {
      url,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  @Get("conversations/:id")
  getMessages(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.messagesService.getMessages(id, userId, page, limit);
  }

  // Legacy: start a listing-scoped buyer↔seller chat
  @Post("conversations")
  startConversation(
    @CurrentUser("id") userId: string,
    @Body(new SanitizePipe()) dto: StartConversationDto,
  ) {
    return this.messagesService.startConversation(
      userId,
      dto.sellerId,
      dto.listingId,
      dto.message,
    );
  }

  // New: get or create a 1:1 DM with any user
  @Post("dm")
  createDm(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateDmDto,
  ) {
    return this.messagesService.getOrCreateDm(userId, dto.otherUserId);
  }

  // New: create a group chat
  @Post("group")
  createGroup(
    @CurrentUser("id") userId: string,
    @Body(new SanitizePipe()) dto: CreateGroupDto,
  ) {
    return this.messagesService.createGroup(
      userId,
      dto.title,
      dto.memberUserIds,
    );
  }

  // Add members to an existing group
  @Post("conversations/:id/members")
  addMembers(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.messagesService.addGroupMembers(id, userId, dto.userIds);
  }

  // Leave a group
  @Post("conversations/:id/leave")
  leaveGroup(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.messagesService.leaveGroup(id, userId);
  }

  // Send a message (any type — text, image, voice, reply, share)
  @Post("conversations/:id")
  sendMessage(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body(new SanitizePipe()) dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(
      id,
      userId,
      dto.content ?? "",
      dto.messageType ?? "text",
      {
        offerAmount: dto.offerAmount,
        mediaUrl: dto.mediaUrl,
        mediaDurationMs: dto.mediaDurationMs,
        mediaWidth: dto.mediaWidth,
        mediaHeight: dto.mediaHeight,
        replyToMessageId: dto.replyToMessageId,
        attachedListingId: dto.attachedListingId,
        attachedVideoId: dto.attachedVideoId,
      },
    );
  }

  // Toggle a reaction on a specific message
  @Post(":messageId/reactions")
  toggleReaction(
    @Param("messageId") messageId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: ReactionDto,
  ) {
    return this.messagesService.toggleReaction(userId, messageId, dto.emoji);
  }

  @Patch("conversations/:id/read")
  markAsRead(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.messagesService.markAsRead(id, userId);
  }

  @Post("offers/:messageId/respond")
  respondToOffer(
    @Param("messageId") messageId: string,
    @CurrentUser("id") userId: string,
    @Body()
    body: { decision: "accept" | "reject" | "counter"; newAmount?: number },
  ) {
    return this.messagesService.respondToOffer(
      messageId,
      userId,
      body.decision,
      body.newAmount,
    );
  }
}
