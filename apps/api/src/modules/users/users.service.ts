import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import { users } from "../../database/schema";

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async findById(id: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        phone: users.phone,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        role: users.role,
        isVerified: users.isVerified,
        province: users.province,
        city: users.city,
        language: users.language,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateProfile(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      email?: string;
      region?: string;
      province?: string;
      city?: string;
      barangay?: string;
      addressLine?: string;
      zipCode?: string;
      language?: string;
    },
  ) {
    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException("User not found");
    }

    return {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      displayName: updated.displayName,
      email: updated.email,
      province: updated.province,
      city: updated.city,
    };
  }

  async getPublicProfile(id: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        province: users.province,
        city: users.city,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }
}
