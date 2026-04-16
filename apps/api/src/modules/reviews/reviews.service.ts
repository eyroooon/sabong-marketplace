import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { eq, and, desc, sql, avg, count } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  reviews,
  orders,
  sellerProfiles,
  users,
  listings,
} from "../../database/schema";
import { CreateReviewDto } from "./dto/create-review.dto";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private notificationsService: NotificationsService,
  ) {}

  async create(reviewerId: string, dto: CreateReviewDto) {
    // Verify order exists
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, dto.orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Verify reviewer is the buyer
    if (order.buyerId !== reviewerId) {
      throw new ForbiddenException("Only the buyer can review this order");
    }

    // Verify order status is completed or delivered
    if (!["completed", "delivered"].includes(order.status)) {
      throw new BadRequestException(
        "You can only review completed or delivered orders",
      );
    }

    // Check no existing review for this order
    const [existingReview] = await this.db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.orderId, dto.orderId))
      .limit(1);

    if (existingReview) {
      throw new ConflictException("You have already reviewed this order");
    }

    // Insert review
    const [review] = await this.db
      .insert(reviews)
      .values({
        orderId: dto.orderId,
        reviewerId,
        sellerId: order.sellerId,
        listingId: order.listingId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        accuracyRating: dto.accuracyRating,
        communicationRating: dto.communicationRating,
        shippingRating: dto.shippingRating,
      })
      .returning();

    // Update seller's avgRating and ratingCount
    await this.updateSellerRatings(order.sellerId);

    // Notify seller of new review
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, order.sellerId))
      .limit(1);

    if (seller?.userId) {
      this.notificationsService
        .create({
          userId: seller.userId,
          type: "new_review",
          title: "New review received",
          body: `You received a ${dto.rating}-star review for your order.`,
          data: { reviewId: review.id, orderId: dto.orderId, rating: dto.rating },
        })
        .catch(() => {});
    }

    return review;
  }

  async getBySellerId(sellerId: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      this.db
        .select({
          id: reviews.id,
          orderId: reviews.orderId,
          reviewerId: reviews.reviewerId,
          sellerId: reviews.sellerId,
          listingId: reviews.listingId,
          rating: reviews.rating,
          title: reviews.title,
          comment: reviews.comment,
          accuracyRating: reviews.accuracyRating,
          communicationRating: reviews.communicationRating,
          shippingRating: reviews.shippingRating,
          sellerResponse: reviews.sellerResponse,
          sellerRespondedAt: reviews.sellerRespondedAt,
          createdAt: reviews.createdAt,
          reviewerFirstName: users.firstName,
          reviewerLastName: users.lastName,
          listingTitle: listings.title,
        })
        .from(reviews)
        .leftJoin(users, eq(users.id, reviews.reviewerId))
        .leftJoin(listings, eq(listings.id, reviews.listingId))
        .where(
          and(eq(reviews.sellerId, sellerId), eq(reviews.isVisible, true)),
        )
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(
          and(eq(reviews.sellerId, sellerId), eq(reviews.isVisible, true)),
        ),
    ]);

    const total = Number(countResult[0]?.count || 0);

    // Calculate average sub-ratings
    const [avgResult] = await this.db
      .select({
        avgRating: sql<string>`ROUND(AVG(${reviews.rating})::numeric, 2)`,
        avgAccuracy: sql<string>`ROUND(AVG(${reviews.accuracyRating})::numeric, 2)`,
        avgCommunication: sql<string>`ROUND(AVG(${reviews.communicationRating})::numeric, 2)`,
        avgShipping: sql<string>`ROUND(AVG(${reviews.shippingRating})::numeric, 2)`,
      })
      .from(reviews)
      .where(
        and(eq(reviews.sellerId, sellerId), eq(reviews.isVisible, true)),
      );

    return {
      data,
      averages: {
        overall: avgResult?.avgRating ? Number(avgResult.avgRating) : 0,
        accuracy: avgResult?.avgAccuracy ? Number(avgResult.avgAccuracy) : 0,
        communication: avgResult?.avgCommunication
          ? Number(avgResult.avgCommunication)
          : 0,
        shipping: avgResult?.avgShipping ? Number(avgResult.avgShipping) : 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getByOrderId(orderId: string) {
    const [review] = await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.orderId, orderId))
      .limit(1);

    return review || null;
  }

  async respondToReview(
    reviewId: string,
    sellerId: string,
    response: string,
  ) {
    // Get review
    const [review] = await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    // Verify the seller owns this review's seller profile
    const [sellerProfile] = await this.db
      .select()
      .from(sellerProfiles)
      .where(
        and(
          eq(sellerProfiles.id, review.sellerId),
          eq(sellerProfiles.userId, sellerId),
        ),
      )
      .limit(1);

    if (!sellerProfile) {
      throw new ForbiddenException("You can only respond to reviews for your own profile");
    }

    const [updated] = await this.db
      .update(reviews)
      .set({
        sellerResponse: response,
        sellerRespondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning();

    // Notify reviewer about seller response
    this.notificationsService
      .create({
        userId: review.reviewerId,
        type: "review_response",
        title: "Seller responded to your review",
        body: "The seller has responded to your review.",
        data: { reviewId: review.id },
      })
      .catch(() => {});

    return updated;
  }

  private async updateSellerRatings(sellerId: string) {
    const [result] = await this.db
      .select({
        avgRating: sql<string>`ROUND(AVG(${reviews.rating})::numeric, 2)`,
        ratingCount: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(
        and(eq(reviews.sellerId, sellerId), eq(reviews.isVisible, true)),
      );

    await this.db
      .update(sellerProfiles)
      .set({
        avgRating: result?.avgRating || "0.00",
        ratingCount: Number(result?.ratingCount || 0),
        updatedAt: new Date(),
      })
      .where(eq(sellerProfiles.id, sellerId));
  }
}
