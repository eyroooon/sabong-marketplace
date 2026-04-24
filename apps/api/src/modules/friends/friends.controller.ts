import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { FriendsService } from "./friends.service";
import { FriendActionDto } from "./dto/friend-action.dto";

@Controller("friends")
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post("request")
  request(@CurrentUser("id") userId: string, @Body() dto: FriendActionDto) {
    return this.friendsService.sendRequest(userId, dto.userId);
  }

  @Post("accept")
  accept(@CurrentUser("id") userId: string, @Body() dto: FriendActionDto) {
    return this.friendsService.acceptRequest(userId, dto.userId);
  }

  @Post("decline")
  decline(@CurrentUser("id") userId: string, @Body() dto: FriendActionDto) {
    return this.friendsService.declineRequest(userId, dto.userId);
  }

  @Post("remove")
  remove(@CurrentUser("id") userId: string, @Body() dto: FriendActionDto) {
    return this.friendsService.removeFriend(userId, dto.userId);
  }

  @Post("block")
  block(@CurrentUser("id") userId: string, @Body() dto: FriendActionDto) {
    return this.friendsService.blockUser(userId, dto.userId);
  }

  @Get()
  list(@CurrentUser("id") userId: string) {
    return this.friendsService.listFriends(userId);
  }

  @Get("requests/incoming")
  incoming(@CurrentUser("id") userId: string) {
    return this.friendsService.listIncomingRequests(userId);
  }

  @Get("requests/outgoing")
  outgoing(@CurrentUser("id") userId: string) {
    return this.friendsService.listOutgoingRequests(userId);
  }

  @Get("status/:userId")
  async status(
    @CurrentUser("id") userId: string,
    @Param("userId") otherId: string,
  ) {
    const status = await this.friendsService.getStatus(userId, otherId);
    return { status };
  }
}
