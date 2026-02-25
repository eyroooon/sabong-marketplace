import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { users, sellerProfiles } from "../../database/schema";
import { RegisterSellerDto } from "./dto/register-seller.dto";

@Injectable()
export class SellersService {
  constructor(@Inject(DRIZZLE) private db: any) {}

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
}
