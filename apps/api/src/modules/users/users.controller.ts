import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

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

  @Get(":id")
  getPublicProfile(@Param("id") id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
