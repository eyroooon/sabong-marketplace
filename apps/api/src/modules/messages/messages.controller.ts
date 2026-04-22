import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { MessagesService } from "./messages.service";
import {
  StartConversationDto,
  SendMessageDto,
} from "./dto/send-message.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SanitizePipe } from "../../common/pipes/sanitize.pipe";

@Controller("messages")
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get("conversations")
  getConversations(@CurrentUser("id") userId: string) {
    return this.messagesService.getConversations(userId);
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

  @Post("conversations/:id")
  sendMessage(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body(new SanitizePipe()) dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(
      id,
      userId,
      dto.content,
      dto.messageType,
      dto.offerAmount,
    );
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
