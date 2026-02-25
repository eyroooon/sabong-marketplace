import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from "@nestjs/common";
import { FavoritesService } from "./favorites.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("favorites")
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  getMyFavorites(@CurrentUser("id") userId: string) {
    return this.favoritesService.getMyFavorites(userId);
  }

  @Get(":listingId/check")
  checkFavorite(
    @CurrentUser("id") userId: string,
    @Param("listingId") listingId: string,
  ) {
    return this.favoritesService.isFavorited(userId, listingId);
  }

  @Post(":listingId")
  add(
    @CurrentUser("id") userId: string,
    @Param("listingId") listingId: string,
  ) {
    return this.favoritesService.add(userId, listingId);
  }

  @Delete(":listingId")
  remove(
    @CurrentUser("id") userId: string,
    @Param("listingId") listingId: string,
  ) {
    return this.favoritesService.remove(userId, listingId);
  }
}
