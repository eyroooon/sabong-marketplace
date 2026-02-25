import { Injectable, Inject } from "@nestjs/common";
import { eq, asc } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { categories, breeds, bloodlines } from "../../database/schema";
import { PROVINCES } from "@sabong/shared";

@Injectable()
export class CategoriesService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async getCategories() {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));
  }

  async getBreeds() {
    return this.db
      .select()
      .from(breeds)
      .where(eq(breeds.isActive, true))
      .orderBy(asc(breeds.name));
  }

  async getBloodlinesByBreed(breedId: number) {
    return this.db
      .select()
      .from(bloodlines)
      .where(eq(bloodlines.breedId, breedId))
      .orderBy(asc(bloodlines.name));
  }

  getProvinces() {
    return PROVINCES.map((p) => ({ name: p.name, region: p.region }));
  }

  getCitiesByProvince(province: string) {
    const found = PROVINCES.find(
      (p) => p.name.toLowerCase() === province.toLowerCase(),
    );
    return found?.cities || [];
  }
}
