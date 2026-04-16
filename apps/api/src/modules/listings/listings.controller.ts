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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ListingsService } from "./listings.service";
import { CreateListingDto } from "./dto/create-listing.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SanitizePipe } from "../../common/pipes/sanitize.pipe";

const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException("Only jpg, png, and webp images are allowed"),
      false,
    );
  }
};

@Controller("listings")
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Get()
  browse(
    @Query("category") category?: string,
    @Query("breed") breed?: string,
    @Query("search") search?: string,
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
      search,
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  create(
    @CurrentUser("id") userId: string,
    @Body(new SanitizePipe()) dto: CreateListingDto,
  ) {
    return this.listingsService.create(userId, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  update(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body(new SanitizePipe()) dto: Partial<CreateListingDto>,
  ) {
    return this.listingsService.update(id, userId, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  delete(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.listingsService.delete(id, userId);
  }

  @Post(":id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  publish(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.listingsService.publish(id, userId);
  }

  @Post(":id/archive")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  archive(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.listingsService.archive(id, userId);
  }

  @Post(":id/images")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor("images", 5, {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
    }),
  )
  uploadImages(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one image file is required");
    }
    return this.listingsService.uploadImages(id, userId, files);
  }

  @Delete(":id/images/:imageId")
  @UseGuards(JwtAuthGuard)
  deleteImage(
    @Param("id") id: string,
    @Param("imageId") imageId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.listingsService.deleteImage(id, imageId, userId);
  }
}
