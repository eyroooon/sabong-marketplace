import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { categories, breeds, bloodlines } from "../schema";
import { CATEGORIES, BREEDS, BLOODLINES } from "@sabong/shared";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://sabong:sabong123@localhost:5432/sabong_marketplace";

async function seed() {
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  console.log("Seeding categories...");
  for (const cat of CATEGORIES) {
    await db
      .insert(categories)
      .values({
        name: cat.name,
        nameFil: cat.nameFil,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding breeds...");
  for (const breed of BREEDS) {
    await db
      .insert(breeds)
      .values({
        name: breed.name,
        origin: breed.origin,
        characteristics: breed.characteristics,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding bloodlines...");
  // First get the breed IDs
  const breedRows = await db.select().from(breeds);
  const breedMap = new Map(breedRows.map((b) => [b.name, b.id]));

  for (const bl of BLOODLINES) {
    const breedId = breedMap.get(bl.breed);
    if (breedId) {
      await db
        .insert(bloodlines)
        .values({
          breedId,
          name: bl.name,
          breeder: bl.breeder,
        })
        .onConflictDoNothing();
    }
  }

  console.log("Seed complete!");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
