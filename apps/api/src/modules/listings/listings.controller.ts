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
} from "@nestjs/common";
import { ListingsService } from "./listings.service";
import { CreateListingDto } from "./dto/create-listing.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("listings")
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Get()
  browse(
    @Query("category") category?: string,
    @Query("breed") breed?: string,
    @Query("min_price") minPrice?: number,
    @Query("max_price") maxPrice?: number,
    @Query("province") province?: string,
    @Query("sort") sort?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.listingsService.browse({
      category,
      breed,
      minPrice,
      maxPrice,
      province,
      sort,
      page,
      limit,
    });
  }

  @Get("featured")
  getFeatured() {
    return this.listingsService.getFeatured();
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  getMyListings(@CurrentUser("id") userId: string) {
    return this.listingsService.getMyListings(userId);
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.listingsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateListingDto,
  ) {
    return this.listingsService.create(userId, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() dto: Partial<CreateListingDto>,
  ) {
    return this.listingsService.update(id, userId, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  delete(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.listingsService.delete(id, userId);
  }

  @Post(":id/publish")
  @UseGuards(JwtAuthGuard)
  publish(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.listingsService.publish(id, userId);
  }

  @Post(":id/archive")
  @UseGuards(JwtAuthGuard)
  archive(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.listingsService.archive(id, userId);
  }
}
