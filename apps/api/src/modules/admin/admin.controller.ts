import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SanitizePipe } from "../../common/pipes/sanitize.pipe";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get("analytics")
  getAnalytics(@Query("range") range?: string) {
    const allowed = ["day", "week", "month", "year"] as const;
    const safe = allowed.includes(range as (typeof allowed)[number])
      ? (range as (typeof allowed)[number])
      : "month";
    return this.adminService.getAnalytics(safe);
  }

  @Get("users")
  getUsers(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.adminService.getUsers(page || 1, limit || 20);
  }

  @Get("listings")
  getListings(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("status") status?: string,
  ) {
    return this.adminService.getListings(page || 1, limit || 20, status);
  }

  @Get("orders")
  getOrders(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.adminService.getOrders(page || 1, limit || 20);
  }

  @Get("reports")
  getReports(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("status") status?: string,
  ) {
    return this.adminService.getReports(page || 1, limit || 20, status);
  }

  @Patch("reports/:id/resolve")
  resolveReport(
    @Param("id") id: string,
    @CurrentUser("id") adminId: string,
    @Body(new SanitizePipe()) body: { notes: string; action?: string },
  ) {
    return this.adminService.resolveReport(id, adminId, body.notes, body.action);
  }

  @Patch("users/:id/toggle")
  toggleUserStatus(
    @Param("id") id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.adminService.toggleUserStatus(id, body.isActive);
  }

  @Patch("listings/:id/status")
  toggleListingStatus(
    @Param("id") id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.toggleListingStatus(id, body.status);
  }
}
