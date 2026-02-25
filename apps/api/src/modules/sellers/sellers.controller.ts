import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { SellersService } from "./sellers.service";
import { RegisterSellerDto } from "./dto/register-seller.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("sellers")
export class SellersController {
  constructor(private sellersService: SellersService) {}

  @Post("register")
  @UseGuards(JwtAuthGuard)
  register(
    @CurrentUser("id") userId: string,
    @Body() dto: RegisterSellerDto,
  ) {
    return this.sellersService.register(userId, dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser("id") userId: string) {
    return this.sellersService.getMyProfile(userId);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateMyProfile(
    @CurrentUser("id") userId: string,
    @Body() dto: Partial<RegisterSellerDto>,
  ) {
    return this.sellersService.updateProfile(userId, dto);
  }

  @Get(":id")
  getPublicProfile(@Param("id") id: string) {
    return this.sellersService.getPublicProfile(id);
  }
}
