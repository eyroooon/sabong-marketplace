import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { eq, and, gte, sql } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  users,
  sellerProfiles,
  notifications,
  listings,
  videos,
} from "../../database/schema";
import { RegisterSellerDto } from "./dto/register-seller.dto";
import { StorageService } from "../../common/storage/storage.service";
import { SELLER_PLANS, PlanType } from "./plans.constants";

@Injectable()
export class SellersService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private storageService: StorageService,
  ) {}

  async register(userId: string, dto: RegisterSellerDto) {
    // Check if already a seller
    const existing = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException("You already have a seller profile");
    }

    const [seller] = await this.db
      .insert(sellerProfiles)
      .values({
        userId,
        farmName: dto.farmName,
        businessType: dto.businessType || "individual",
        description: dto.description,
        farmProvince: dto.farmProvince,
        farmCity: dto.farmCity,
        farmBarangay: dto.farmBarangay,
        facebookUrl: dto.facebookUrl,
        youtubeUrl: dto.youtubeUrl,
        tiktokUrl: dto.tiktokUrl,
      })
      .returning();

    // Update user role to seller
    await this.db
      .update(users)
      .set({ role: "seller", updatedAt: new Date() })
      .where(eq(users.id, userId));

    return {
      id: seller.id,
      farmName: seller.farmName,
      verificationStatus: seller.verificationStatus,
      message:
        "Your seller application is under review. We'll notify you within 24-48 hours.",
    };
  }

  async getMyProfile(userId: string) {
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId))
      .limit(1);

    if (!seller) {
      throw new NotFoundException("Seller profile not found");
    }

    return seller;
  }

  async getPublicProfile(sellerId: string) {
    const [seller] = await this.db
      .select({
        id: sellerProfiles.id,
        farmName: sellerProfiles.farmName,
        description: sellerProfiles.description,
        verificationStatus: sellerProfiles.verificationStatus,
        verifiedAt: sellerProfiles.verifiedAt,
        plan: sellerProfiles.plan,
        totalSales: sellerProfiles.totalSales,
        totalListings: sellerProfiles.totalListings,
        avgRating: sellerProfiles.avgRating,
        ratingCount: sellerProfiles.ratingCount,
        responseRate: sellerProfiles.responseRate,
        responseTime: sellerProfiles.responseTime,
        farmProvince: sellerProfiles.farmProvince,
        farmCity: sellerProfiles.farmCity,
        facebookUrl: sellerProfiles.facebookUrl,
        youtubeUrl: sellerProfiles.youtubeUrl,
        tiktokUrl: sellerProfiles.tiktokUrl,
        createdAt: sellerProfiles.createdAt,
      })
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, sellerId))
      .limit(1);

    if (!seller) {
      throw new NotFoundException("Seller not found");
    }

    return seller;
  }

  async updateProfile(userId: string, data: Partial<RegisterSellerDto>) {
    const [updated] = await this.db
      .update(sellerProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sellerProfiles.userId, userId))
      .returning();

    if (!updated) {
      throw new NotFoundException("Seller profile not found");
    }

    return updated;
  }

  async uploadDocuments(
    userId: string,
    files: { governmentId?: Express.Multer.File[]; farmPermit?: Express.Multer.File[] },
  ) {
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId))
      .limit(1);

    if (!seller) {
      throw new NotFoundException("Seller profile not found");
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (files.governmentId && files.governmentId.length > 0) {
      updateData.governmentIdUrl = await this.storageService.uploadFile(
        files.governmentId[0],
        "documents",
      );
    }

    if (files.farmPermit && files.farmPermit.length > 0) {
      updateData.farmPermitUrl = await this.storageService.uploadFile(
        files.farmPermit[0],
        "documents",
      );
    }

    // If status was 'rejected', reset to 'pending' when re-uploading documents
    if (seller.verificationStatus === "rejected") {
      updateData.verificationStatus = "pending";
    }

    // If no documents were uploaded before, set to pending
    if (!seller.governmentIdUrl && updateData.governmentIdUrl) {
      updateData.verificationStatus = "pending";
    }

    const [updated] = await this.db
      .update(sellerProfiles)
      .set(updateData)
      .where(eq(sellerProfiles.userId, userId))
      .returning();

    return {
      id: updated.id,
      governmentIdUrl: updated.governmentIdUrl,
      farmPermitUrl: updated.farmPermitUrl,
      verificationStatus: updated.verificationStatus,
      message: "Documents uploaded successfully. Verification is under review.",
    };
  }

  async adminVerifySeller(
    sellerId: string,
    action: "verified" | "rejected",
    adminNote?: string,
  ) {
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, sellerId))
      .limit(1);

    if (!seller) {
      throw new NotFoundException("Seller not found");
    }

    const updateData: Record<string, any> = {
      verificationStatus: action,
      updatedAt: new Date(),
    };

    if (action === "verified") {
      updateData.verifiedAt = new Date();
    }

    const [updated] = await this.db
      .update(sellerProfiles)
      .set(updateData)
      .where(eq(sellerProfiles.id, sellerId))
      .returning();

    // Send notification to the seller
    const notificationTitle =
      action === "verified"
        ? "Your seller profile has been verified!"
        : "Seller verification update";
    const notificationBody =
      action === "verified"
        ? "Congratulations! Your seller account has been verified. You now have a verified badge on your profile."
        : adminNote || "Your verification was not approved. Please re-upload your documents.";

    await this.db.insert(notifications).values({
      userId: seller.userId,
      type: "verification",
      title: notificationTitle,
      body: notificationBody,
      data: { sellerId: seller.id, action },
    });

    return {
      id: updated.id,
      verificationStatus: updated.verificationStatus,
      verifiedAt: updated.verifiedAt,
      message: `Seller ${action === "verified" ? "approved" : "rejected"} successfully.`,
    };
  }

  // ----- Seller Plans -----

  getPlans() {
    return Object.entries(SELLER_PLANS).map(([id, plan]) => ({
      id,
      ...plan,
    }));
  }

  private async getSellerOrThrow(userId: string) {
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId))
      .limit(1);

    if (!seller) {
      throw new NotFoundException("Seller profile not found");
    }

    return seller;
  }

  private async getActiveListingsCount(sellerId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(
        and(
          eq(listings.sellerId, sellerId),
          eq(listings.status, "active"),
        ),
      );
    return Number(row?.count || 0);
  }

  private async getVideosThisMonthCount(userId: string): Promise<number> {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(
        and(
          eq(videos.userId, userId),
          gte(videos.createdAt, monthStart),
        ),
      );
    return Number(row?.count || 0);
  }

  async getMyPlan(userId: string) {
    const seller = await this.getSellerOrThrow(userId);

    const planId = (seller.plan as PlanType) || "free";
    const planConfig =
      SELLER_PLANS[planId] ?? SELLER_PLANS.free;

    // Check if plan has expired — fall back to free plan
    const now = new Date();
    const expired =
      seller.planExpiresAt && new Date(seller.planExpiresAt) < now;
    const effectivePlanId: PlanType = expired ? "free" : planId;
    const effectivePlan = SELLER_PLANS[effectivePlanId];

    const [activeListings, videosThisMonth] = await Promise.all([
      this.getActiveListingsCount(seller.id),
      this.getVideosThisMonthCount(userId),
    ]);

    return {
      plan: effectivePlanId,
      planDetails: effectivePlan,
      planExpiresAt: seller.planExpiresAt,
      expired: !!expired,
      usage: {
        activeListings,
        maxActiveListings: effectivePlan.maxActiveListings,
        videosThisMonth,
        maxVideosPerMonth: effectivePlan.maxVideosPerMonth,
      },
    };
  }

  async upgradePlan(userId: string, plan: PlanType) {
    if (!Object.prototype.hasOwnProperty.call(SELLER_PLANS, plan)) {
      throw new BadRequestException(
        `Invalid plan. Must be one of: ${Object.keys(SELLER_PLANS).join(", ")}`,
      );
    }

    const seller = await this.getSellerOrThrow(userId);

    // TODO: Integrate with PayMongo billing — in production, this endpoint
    // should create a payment intent / subscription with PayMongo and only
    // update the plan after successful payment confirmation via webhook.
    // For MVP we simply set the plan and a 30-day expiry.
    const expiresAt =
      plan === "free"
        ? null
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [updated] = await this.db
      .update(sellerProfiles)
      .set({
        plan,
        planExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(sellerProfiles.id, seller.id))
      .returning();

    // Notify seller of plan change
    await this.db.insert(notifications).values({
      userId,
      type: "plan_updated",
      title: `Plan updated to ${SELLER_PLANS[plan].name}`,
      body:
        plan === "free"
          ? "Your plan has been changed to the Free tier."
          : `You've upgraded to the ${SELLER_PLANS[plan].name} plan. Enjoy your new benefits for the next 30 days.`,
      data: { plan, planExpiresAt: expiresAt },
    });

    return {
      id: updated.id,
      plan: updated.plan,
      planExpiresAt: updated.planExpiresAt,
      message: `Successfully switched to ${SELLER_PLANS[plan].name} plan.`,
    };
  }

  async checkListingLimit(userId: string) {
    const seller = await this.getSellerOrThrow(userId);

    const planId = (seller.plan as PlanType) || "free";
    const now = new Date();
    const expired =
      seller.planExpiresAt && new Date(seller.planExpiresAt) < now;
    const effectivePlan = expired
      ? SELLER_PLANS.free
      : SELLER_PLANS[planId] ?? SELLER_PLANS.free;

    // Unlimited listings
    if (effectivePlan.maxActiveListings === -1) {
      return { allowed: true };
    }

    const activeListings = await this.getActiveListingsCount(seller.id);

    if (activeListings >= effectivePlan.maxActiveListings) {
      throw new ForbiddenException(
        `You've reached your plan's active listing limit (${effectivePlan.maxActiveListings}). Upgrade to add more.`,
      );
    }

    return { allowed: true };
  }

  async checkVideoLimit(userId: string) {
    const seller = await this.getSellerOrThrow(userId);

    const planId = (seller.plan as PlanType) || "free";
    const now = new Date();
    const expired =
      seller.planExpiresAt && new Date(seller.planExpiresAt) < now;
    const effectivePlan = expired
      ? SELLER_PLANS.free
      : SELLER_PLANS[planId] ?? SELLER_PLANS.free;

    if (!effectivePlan.canPostVideos) {
      throw new ForbiddenException(
        "Your plan does not allow posting videos. Upgrade to post videos.",
      );
    }

    // Unlimited videos
    if (effectivePlan.maxVideosPerMonth === -1) {
      return { allowed: true };
    }

    const videosThisMonth = await this.getVideosThisMonthCount(userId);

    if (videosThisMonth >= effectivePlan.maxVideosPerMonth) {
      throw new ForbiddenException(
        `You've reached your plan's monthly video limit (${effectivePlan.maxVideosPerMonth}). Upgrade to post more.`,
      );
    }

    return { allowed: true };
  }
}
