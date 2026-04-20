import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { eq, and, or, desc, asc, gte, lte, sql, ilike } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  listings,
  listingImages,
  sellerProfiles,
} from "../../database/schema";
import { generateSlug } from "@sabong/shared";
import { CreateListingDto } from "./dto/create-listing.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { StorageService } from "../../common/storage/storage.service";
import { SellersService } from "../sellers/sellers.service";

@Injectable()
export class ListingsService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private notificationsService: NotificationsService,
    private storageService: StorageService,
    private sellersService: SellersService,
  ) {}

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

    // Enforce plan's active listing limit
    await this.sellersService.checkListingLimit(userId);

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
        userId: sellerProfiles.userId,
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
    search?: string;
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
    if (filters.search) {
      conditions.push(
        or(
          ilike(listings.title, `%${filters.search}%`),
          ilike(listings.description, `%${filters.search}%`),
          ilike(listings.breed, `%${filters.search}%`),
        )!,
      );
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

    // Get seller verification statuses
    const sellerIds = [...new Set(data.map((l: any) => l.sellerId))];
    let sellerMap = new Map<string, any>();
    if (sellerIds.length > 0) {
      const sellers = await this.db
        .select({
          id: sellerProfiles.id,
          farmName: sellerProfiles.farmName,
          verificationStatus: sellerProfiles.verificationStatus,
        })
        .from(sellerProfiles)
        .where(sql`${sellerProfiles.id} IN ${sellerIds}`);
      sellerMap = new Map(sellers.map((s: any) => [s.id, s]));
    }

    const results = data.map((listing: any) => {
      const seller = sellerMap.get(listing.sellerId);
      return {
        ...listing,
        primaryImage: imageMap.get(listing.id)?.url || null,
        sellerVerified: seller?.verificationStatus === "verified",
        sellerName: seller?.farmName || null,
      };
    });

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

    // Notify seller that their listing is now live
    this.notificationsService
      .create({
        userId,
        type: "listing_published",
        title: "Listing published",
        body: `Your listing "${updated.title}" is now live and visible to buyers.`,
        data: { listingId: updated.id, slug: updated.slug },
      })
      .catch(() => {}); // Fire and forget

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

    // Enrich with primary images + seller info (same shape as browse()) so
    // home-screen rails can render without a second round-trip.
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

    const sellerIds = [...new Set(data.map((l: any) => l.sellerId))];
    let sellerMap = new Map<string, any>();
    if (sellerIds.length > 0) {
      const sellers = await this.db
        .select({
          id: sellerProfiles.id,
          farmName: sellerProfiles.farmName,
          verificationStatus: sellerProfiles.verificationStatus,
        })
        .from(sellerProfiles)
        .where(sql`${sellerProfiles.id} IN ${sellerIds}`);
      sellerMap = new Map(sellers.map((s: any) => [s.id, s]));
    }

    const results = data.map((listing: any) => {
      const seller = sellerMap.get(listing.sellerId);
      return {
        ...listing,
        primaryImage: imageMap.get(listing.id)?.url || null,
        sellerVerified: seller?.verificationStatus === "verified",
        sellerName: seller?.farmName || null,
      };
    });

    return { data: results };
  }

  async uploadImages(listingId: string, userId: string, files: Express.Multer.File[]) {
    await this.verifyOwnership(listingId, userId);

    // Check how many images already exist for this listing
    const existingImages = await this.db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, listingId));

    const hasPrimary = existingImages.some((img: any) => img.isPrimary);

    const records = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await this.storageService.uploadFile(file, "images");
      const isPrimary = !hasPrimary && i === 0;

      const [record] = await this.db
        .insert(listingImages)
        .values({
          listingId,
          url,
          altText: file.originalname,
          sortOrder: existingImages.length + i,
          isPrimary,
        })
        .returning();

      records.push(record);
    }

    return { images: records };
  }

  async deleteImage(listingId: string, imageId: string, userId: string) {
    await this.verifyOwnership(listingId, userId);

    const [image] = await this.db
      .select()
      .from(listingImages)
      .where(
        and(
          eq(listingImages.id, imageId),
          eq(listingImages.listingId, listingId),
        ),
      )
      .limit(1);

    if (!image) {
      throw new NotFoundException("Image not found");
    }

    // Delete the file from storage (R2 or local disk)
    await this.storageService.delete(image.url);

    await this.db
      .delete(listingImages)
      .where(eq(listingImages.id, imageId));

    // If deleted image was primary, set the next image as primary
    if (image.isPrimary) {
      const [nextImage] = await this.db
        .select()
        .from(listingImages)
        .where(eq(listingImages.listingId, listingId))
        .orderBy(asc(listingImages.sortOrder))
        .limit(1);

      if (nextImage) {
        await this.db
          .update(listingImages)
          .set({ isPrimary: true })
          .where(eq(listingImages.id, nextImage.id));
      }
    }

    return { message: "Image deleted" };
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
