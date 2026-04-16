import {
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  getMyNotifications(
    @CurrentUser("id") userId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.notificationsService.getMyNotifications(
      userId,
      page || 1,
      limit || 20,
    );
  }

  @Get("unread-count")
  getUnreadCount(@CurrentUser("id") userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(":id/read")
  markAsRead(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch("read-all")
  markAllAsRead(@CurrentUser("id") userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete("old")
  deleteOld(@CurrentUser("id") userId: string) {
    return this.notificationsService.deleteOld(userId);
  }
}
