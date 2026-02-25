import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { eq, and, desc, sql } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { favorites, listings } from "../../database/schema";

@Injectable()
export class FavoritesService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async add(userId: string, listingId: string) {
    // Verify listing exists
    const [listing] = await this.db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!listing) {
      throw new NotFoundException("Listing not found");
    }

    try {
      await this.db.insert(favorites).values({ userId, listingId });

      // Increment favorite count
      await this.db
        .update(listings)
        .set({ favoriteCount: sql`${listings.favoriteCount} + 1` })
        .where(eq(listings.id, listingId));

      return { message: "Added to favorites" };
    } catch (err: any) {
      if (err.code === "23505") {
        throw new ConflictException("Already in favorites");
      }
      throw err;
    }
  }

  async remove(userId: string, listingId: string) {
    const result = await this.db
      .delete(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)),
      )
      .returning();

    if (result.length > 0) {
      await this.db
        .update(listings)
        .set({
          favoriteCount: sql`GREATEST(${listings.favoriteCount} - 1, 0)`,
        })
        .where(eq(listings.id, listingId));
    }

    return { message: "Removed from favorites" };
  }

  async getMyFavorites(userId: string) {
    const data = await this.db
      .select({
        id: favorites.id,
        listingId: favorites.listingId,
        createdAt: favorites.createdAt,
        listing: {
          id: listings.id,
          title: listings.title,
          slug: listings.slug,
          category: listings.category,
          breed: listings.breed,
          price: listings.price,
          priceType: listings.priceType,
          locationProvince: listings.locationProvince,
          locationCity: listings.locationCity,
          status: listings.status,
        },
      })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    return { data };
  }

  async isFavorited(userId: string, listingId: string) {
    const [result] = await this.db
      .select({ id: favorites.id })
      .from(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)),
      )
      .limit(1);

    return { isFavorited: !!result };
  }
}
