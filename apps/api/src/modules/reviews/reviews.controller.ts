import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto, RespondToReviewDto } from "./dto/create-review.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SanitizePipe } from "../../common/pipes/sanitize.pipe";

@Controller("reviews")
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser("id") userId: string,
    @Body(new SanitizePipe()) dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, dto);
  }

  @Get("seller/:sellerId")
  getBySellerId(
    @Param("sellerId") sellerId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.reviewsService.getBySellerId(
      sellerId,
      page || 1,
      limit || 10,
    );
  }

  @Get("order/:orderId")
  @UseGuards(JwtAuthGuard)
  getByOrderId(@Param("orderId") orderId: string) {
    return this.reviewsService.getByOrderId(orderId);
  }

  @Patch(":id/respond")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  respondToReview(
    @Param("id") reviewId: string,
    @CurrentUser("id") userId: string,
    @Body(new SanitizePipe()) dto: RespondToReviewDto,
  ) {
    return this.reviewsService.respondToReview(
      reviewId,
      userId,
      dto.response,
    );
  }
}
