import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me/stats")
  @UseGuards(JwtAuthGuard)
  getDashboardStats(@CurrentUser("id") userId: string) {
    return this.usersService.getDashboardStats(userId);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser("id") userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser("id") userId: string, @Body() body: any) {
    return this.usersService.updateProfile(userId, body);
  }

  // MUST be declared before @Get(":id") so the literal segments win over the param
  @Get("search")
  @UseGuards(JwtAuthGuard)
  search(@Query("q") q: string, @CurrentUser("id") userId: string) {
    return this.usersService.searchUsers(q ?? "", userId);
  }

  @Get("suggestions")
  @UseGuards(JwtAuthGuard)
  suggestions(@CurrentUser("id") userId: string) {
    return this.usersService.suggestFriends(userId);
  }

  @Get(":id")
  getPublicProfile(@Param("id") id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
