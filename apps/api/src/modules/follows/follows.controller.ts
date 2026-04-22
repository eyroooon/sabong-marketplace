import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { FollowsService } from "./follows.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("users")
export class FollowsController {
  constructor(private followsService: FollowsService) {}

  @Post(":id/follow")
  @UseGuards(JwtAuthGuard)
  follow(
    @Param("id") targetUserId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.followsService.follow(userId, targetUserId);
  }

  @Delete(":id/follow")
  @UseGuards(JwtAuthGuard)
  unfollow(
    @Param("id") targetUserId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.followsService.unfollow(userId, targetUserId);
  }

  @Get(":id/follow/status")
  @UseGuards(JwtAuthGuard)
  status(
    @Param("id") targetUserId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.followsService.isFollowing(userId, targetUserId);
  }

  @Get(":id/followers")
  followers(
    @Param("id") userId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.followsService.listFollowers(userId, page || 1, limit || 20);
  }

  @Get(":id/following")
  following(
    @Param("id") userId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.followsService.listFollowing(userId, page || 1, limit || 20);
  }
}
