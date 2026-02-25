import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { eq, and, desc, asc, gte, lte, sql, ilike } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  listings,
  listingImages,
  sellerProfiles,
} from "../../database/schema";
import { generateSlug } from "@sabong/shared";
import { CreateListingDto } from "./dto/create-listing.dto";

@Injectable()
export class ListingsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async create(userId: string, dto: CreateListingDto) {
    // Get seller profile
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId))
      .limit(1);

    if (!seller) {
      throw new ForbiddenException("You must be a seller to create listings");
    }

    const slug = generateSlug(dto.title);

    const [listing] = await this.db
      .insert(listings)
      .values({
        sellerId: seller.id,
        title: dto.title,
        description: dto.description,
        slug,
        category: dto.category,
        breed: dto.breed,
        bloodline: dto.bloodline,
        ageMonths: dto.ageMonths,
        weightKg: dto.weightKg?.toString(),
        color: dto.color,
        legColor: dto.legColor,
        fightingStyle: dto.fightingStyle,
        sireInfo: dto.sireInfo,
        damInfo: dto.damInfo,
        vaccinationStatus: dto.vaccinationStatus,
        price: dto.price.toString(),
        priceType: dto.priceType || "fixed",
        minBid: dto.minBid?.toString(),
        locationProvince: dto.locationProvince,
        locationCity: dto.locationCity,
        shippingAvailable: dto.shippingAvailable ?? false,
        shippingAreas: dto.shippingAreas || "local",
        shippingFee: dto.shippingFee?.toString(),
        meetupAvailable: dto.meetupAvailable ?? true,
        status: "draft",
      })
      .returning();

    return {
      id: listing.id,
      slug: listing.slug,
      status: listing.status,
      message: "Listing created as draft. Publish when ready.",
    };
  }

  async findBySlug(slug: string) {
    const [listing] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.slug, slug))
      .limit(1);

    if (!listing) {
      throw new NotFoundException("Listing not found");
    }

    // Get images
    const images = await this.db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, listing.id))
      .orderBy(asc(listingImages.sortOrder));

    // Get seller info
    const [seller] = await this.db
      .select({
        id: sellerProfiles.id,
        farmName: sellerProfiles.farmName,
        avgRating: sellerProfiles.avgRating,
        verificationStatus: sellerProfiles.verificationStatus,
        farmProvince: sellerProfiles.farmProvince,
        farmCity: sellerProfiles.farmCity,
      })
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, listing.sellerId))
      .limit(1);

    // Increment view count
    await this.db
      .update(listings)
      .set({ viewCount: sql`${listings.viewCount} + 1` })
      .where(eq(listings.id, listing.id));

    return { ...listing, images, seller };
  }

  async browse(filters: {
    category?: string;
    breed?: string;
    minPrice?: number;
    maxPrice?: number;
    province?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(listings.status, "active")];

    if (filters.category) {
      conditions.push(eq(listings.category, filters.category));
    }
    if (filters.breed) {
      conditions.push(ilike(listings.breed, `%${filters.breed}%`));
    }
    if (filters.minPrice) {
      conditions.push(gte(listings.price, filters.minPrice.toString()));
    }
    if (filters.maxPrice) {
      conditions.push(lte(listings.price, filters.maxPrice.toString()));
    }
    if (filters.province) {
      conditions.push(eq(listings.locationProvince, filters.province));
    }

    // Sort
    let orderBy;
    switch (filters.sort) {
      case "price_asc":
        orderBy = asc(listings.price);
        break;
      case "price_desc":
        orderBy = desc(listings.price);
        break;
      case "popular":
        orderBy = desc(listings.viewCount);
        break;
      default:
        orderBy = desc(listings.createdAt);
    }

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(listings)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(where),
    ]);

    const total = Number(countResult[0]?.count || 0);

    // Get primary images for each listing
    const listingIds = data.map((l: any) => l.id);
    let images: any[] = [];
    if (listingIds.length > 0) {
      images = await this.db
        .select()
        .from(listingImages)
        .where(
          and(
            eq(listingImages.isPrimary, true),
            sql`${listingImages.listingId} IN ${listingIds}`,
          ),
        );
    }

    const imageMap = new Map(images.map((img: any) => [img.listingId, img]));

    const results = data.map((listing: any) => ({
      ...listing,
      primaryImage: imageMap.get(listing.id)?.url || null,
    }));

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async publish(listingId: string, userId: string) {
    const listing = await this.verifyOwnership(listingId, userId);

    const [updated] = await this.db
      .update(listings)
      .set({
        status: "active",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listing.id))
      .returning();

    return { id: updated.id, status: updated.status };
  }

  async archive(listingId: string, userId: string) {
    const listing = await this.verifyOwnership(listingId, userId);

    const [updated] = await this.db
      .update(listings)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(listings.id, listing.id))
      .returning();

    return { id: updated.id, status: updated.status };
  }

  async update(listingId: string, userId: string, data: Partial<CreateListingDto>) {
    await this.verifyOwnership(listingId, userId);

    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.price) updateData.price = data.price.toString();
    if (data.weightKg) updateData.weightKg = data.weightKg.toString();
    if (data.shippingFee) updateData.shippingFee = data.shippingFee.toString();
    if (data.minBid) updateData.minBid = data.minBid.toString();

    const [updated] = await this.db
      .update(listings)
      .set(updateData)
      .where(eq(listings.id, listingId))
      .returning();

    return updated;
  }

  async delete(listingId: string, userId: string) {
    await this.verifyOwnership(listingId, userId);

    await this.db.delete(listings).where(eq(listings.id, listingId));

    return { message: "Listing deleted" };
  }

  async getMyListings(userId: string) {
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId))
      .limit(1);

    if (!seller) {
      return { data: [] };
    }

    const data = await this.db
      .select()
      .from(listings)
      .where(eq(listings.sellerId, seller.id))
      .orderBy(desc(listings.createdAt));

    return { data };
  }

  async getFeatured() {
    const data = await this.db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.status, "active"),
          eq(listings.isFeatured, true),
        ),
      )
      .orderBy(desc(listings.createdAt))
      .limit(12);

    return { data };
  }

  private async verifyOwnership(listingId: string, userId: string) {
    const [listing] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!listing) {
      throw new NotFoundException("Listing not found");
    }

    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(
        and(
          eq(sellerProfiles.id, listing.sellerId),
          eq(sellerProfiles.userId, userId),
        ),
      )
      .limit(1);

    if (!seller) {
      throw new ForbiddenException("You do not own this listing");
    }

    return listing;
  }
}
