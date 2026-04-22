/**
 * Demo seed — wipes user data + inserts a rich, deterministic dataset
 * for the mock-trial presentation.
 *
 *   pnpm --filter @sabong/api demo:reset
 *
 * Safe to run repeatedly. Every run produces the exact same demo state.
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as bcrypt from "bcrypt";
import { sql } from "drizzle-orm";
import {
  users,
  sellerProfiles,
  listings,
  listingImages,
  orders,
  payments,
  reviews,
  videos,
  videoComments,
  videoLikes,
  follows,
  conversations,
  messages,
  notifications,
  favorites,
} from "../schema";
import {
  DEMO_PASSWORD,
  DEMO_USERS,
  DEMO_LISTINGS,
  DEMO_VIDEOS,
  DEMO_VIDEOS_POOL,
  DEMO_COMMENTS,
  DEMO_ORDERS,
  DEMO_CONVERSATIONS,
  DEMO_REVIEWS,
  DEMO_FOLLOWS,
  DEMO_NOTIFICATIONS,
  listingImg,
  type DemoUserKey,
} from "./fixtures";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://sabong:sabong123@localhost:5432/sabong_marketplace";

async function run() {
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  console.log("\n🧹 Wiping existing user data…");
  await wipeData(db);

  console.log("🔐 Hashing password…");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log("👥 Seeding users…");
  const userIdByKey = await seedUsers(db, passwordHash);

  console.log("🏪 Seeding seller profiles…");
  const sellerProfileIdByKey = await seedSellerProfiles(db, userIdByKey);

  console.log("🐓 Seeding listings…");
  const listingIdBySlug = await seedListings(db, sellerProfileIdByKey);

  console.log("🖼️  Seeding listing images…");
  await seedListingImages(db, listingIdBySlug);

  console.log("🎥 Seeding videos…");
  const videoIdByKey = await seedVideos(db, userIdByKey, listingIdBySlug);

  console.log("💬 Seeding video comments…");
  await seedVideoComments(db, videoIdByKey, userIdByKey);

  console.log("❤️  Seeding video likes…");
  await seedVideoLikes(db, videoIdByKey, userIdByKey);

  console.log("🤝 Seeding follows…");
  await seedFollows(db, userIdByKey);

  console.log("💌 Seeding conversations + messages…");
  await seedConversations(db, userIdByKey, listingIdBySlug);

  console.log("📦 Seeding orders + payments…");
  const orderIdByKey = await seedOrders(
    db,
    userIdByKey,
    sellerProfileIdByKey,
    listingIdBySlug,
  );

  console.log("⭐ Seeding reviews…");
  await seedReviews(
    db,
    orderIdByKey,
    userIdByKey,
    sellerProfileIdByKey,
    listingIdBySlug,
  );

  console.log("🔔 Seeding notifications…");
  await seedNotifications(db, userIdByKey);

  console.log("\n✨ Demo seed complete!\n");
  printSummary();

  await client.end();
}

async function wipeData(db: ReturnType<typeof drizzle>) {
  // Order matters: delete child tables before parents.
  await db.execute(sql`DELETE FROM notifications`);
  await db.execute(sql`DELETE FROM favorites`);
  await db.execute(sql`DELETE FROM reports`);
  await db.execute(sql`DELETE FROM video_comments`);
  await db.execute(sql`DELETE FROM video_likes`);
  await db.execute(sql`DELETE FROM videos`);
  await db.execute(sql`DELETE FROM follows`);
  await db.execute(sql`DELETE FROM messages`);
  await db.execute(sql`DELETE FROM conversations`);
  await db.execute(sql`DELETE FROM payments`);
  await db.execute(sql`DELETE FROM reviews`);
  await db.execute(sql`DELETE FROM orders`);
  await db.execute(sql`DELETE FROM listing_images`);
  await db.execute(sql`DELETE FROM listings`);
  await db.execute(sql`DELETE FROM seller_profiles`);
  await db.execute(sql`DELETE FROM users`);
}

async function seedUsers(
  db: ReturnType<typeof drizzle>,
  passwordHash: string,
) {
  const idByKey = new Map<DemoUserKey, string>();

  for (const u of DEMO_USERS) {
    const [row] = await db
      .insert(users)
      .values({
        phone: u.phone,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        displayName: u.displayName,
        role: u.role,
        isVerified: u.isVerified,
        phoneVerified: true,
        emailVerified: false,
        province: u.province,
        city: u.city,
        language: "fil",
      })
      .returning({ id: users.id });
    idByKey.set(u.key, row.id);
  }
  return idByKey;
}

async function seedSellerProfiles(
  db: ReturnType<typeof drizzle>,
  userIdByKey: Map<DemoUserKey, string>,
) {
  const idByKey = new Map<DemoUserKey, string>();
  const sellersSpec = [
    {
      key: "seller_tomas" as const,
      farmName: "Mang Tomas Breeder",
      description: "Pampanga's finest Kelso & Asil breeding farm. 15+ years.",
      status: "verified",
      totalSales: 47,
      rating: "4.80",
      ratingCount: 38,
      responseRate: "95.00",
      responseTime: 15,
      plan: "pro",
      province: "Pampanga",
      city: "Angeles",
    },
    {
      key: "seller_kelsofarm" as const,
      farmName: "Kelso Farm PH",
      description: "Specialized Kelso, Sweater, and Hatch bloodlines.",
      status: "verified",
      totalSales: 23,
      rating: "4.90",
      ratingCount: 19,
      responseRate: "100.00",
      responseTime: 8,
      plan: "basic",
      province: "Batangas",
      city: "Lipa",
    },
    {
      key: "seller_mike" as const,
      farmName: "Sabungero Mike's Farm",
      description: "Starting farm from Cavite. Beginner-friendly prices.",
      status: "pending", // ← admin will verify this in demo
      totalSales: 0,
      rating: "0.00",
      ratingCount: 0,
      responseRate: "0.00",
      responseTime: 0,
      plan: "free",
      province: "Cavite",
      city: "Dasmariñas",
    },
  ];

  for (const s of sellersSpec) {
    const userId = userIdByKey.get(s.key)!;
    const [row] = await db
      .insert(sellerProfiles)
      .values({
        userId,
        farmName: s.farmName,
        businessType: "individual",
        description: s.description,
        verificationStatus: s.status,
        verifiedAt: s.status === "verified" ? new Date() : null,
        governmentIdUrl: s.status !== "verified" ? listingImg(`id-${s.key}`) : null,
        farmPermitUrl: s.status !== "verified" ? listingImg(`permit-${s.key}`) : null,
        plan: s.plan,
        totalSales: s.totalSales,
        totalListings: 0, // updated below after listings seeded
        avgRating: s.rating,
        ratingCount: s.ratingCount,
        responseRate: s.responseRate,
        responseTime: s.responseTime,
        farmProvince: s.province,
        farmCity: s.city,
      })
      .returning({ id: sellerProfiles.id });
    idByKey.set(s.key, row.id);
  }
  return idByKey;
}

async function seedListings(
  db: ReturnType<typeof drizzle>,
  sellerProfileIdByKey: Map<DemoUserKey, string>,
) {
  const idBySlug = new Map<string, string>();

  for (const l of DEMO_LISTINGS) {
    const sellerId = sellerProfileIdByKey.get(l.sellerKey)!;
    const [row] = await db
      .insert(listings)
      .values({
        sellerId,
        title: l.title,
        description: l.description,
        slug: l.slug,
        category: l.category,
        breed: l.breed,
        bloodline: l.bloodline ?? null,
        ageMonths: l.ageMonths,
        weightKg: (l.weightGrams / 1000).toFixed(2),
        price: l.price.toFixed(2),
        priceType: l.priceType,
        status: l.status,
        isFeatured: l.isFeatured,
        featuredUntil: l.isFeatured
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
        locationProvince: l.province,
        locationCity: l.city,
        shippingAvailable: true,
        shippingAreas: "nationwide",
        shippingFee: "600.00",
        meetupAvailable: true,
        vaccinationStatus: "complete",
        viewCount: l.viewCount,
        favoriteCount: l.favoriteCount,
        publishedAt: l.status === "draft" ? null : new Date(),
      })
      .returning({ id: listings.id });
    idBySlug.set(l.slug, row.id);
  }

  // Update seller's totalListings count
  for (const [sellerKey, sellerId] of sellerProfileIdByKey.entries()) {
    const count = DEMO_LISTINGS.filter((l) => l.sellerKey === sellerKey).length;
    await db
      .update(sellerProfiles)
      .set({ totalListings: count })
      .where(sql`id = ${sellerId}`);
  }

  return idBySlug;
}

async function seedListingImages(
  db: ReturnType<typeof drizzle>,
  listingIdBySlug: Map<string, string>,
) {
  for (const l of DEMO_LISTINGS) {
    const listingId = listingIdBySlug.get(l.slug)!;
    const rows = l.imageSeeds.map((seed, idx) => ({
      listingId,
      url: listingImg(seed, 800, 1000),
      thumbnailUrl: listingImg(seed, 400, 500),
      altText: `${l.title} photo ${idx + 1}`,
      sortOrder: idx,
      isPrimary: idx === 0,
    }));
    if (rows.length > 0) {
      await db.insert(listingImages).values(rows);
    }
  }
}

async function seedVideos(
  db: ReturnType<typeof drizzle>,
  userIdByKey: Map<DemoUserKey, string>,
  listingIdBySlug: Map<string, string>,
) {
  const idByKey = new Map<string, string>();

  DEMO_VIDEOS.forEach((v, idx) => {
    // preflight: just to validate mapping, actual insert below
    void v;
    void idx;
  });

  for (let i = 0; i < DEMO_VIDEOS.length; i++) {
    const v = DEMO_VIDEOS[i];
    const userId = userIdByKey.get(v.creatorKey)!;
    const listingId = v.listingSlug
      ? listingIdBySlug.get(v.listingSlug) ?? null
      : null;
    const videoUrl = DEMO_VIDEOS_POOL[i % DEMO_VIDEOS_POOL.length];
    const thumbnailSeed = `thumb-${v.key}`;
    const [row] = await db
      .insert(videos)
      .values({
        userId,
        listingId,
        type: v.type,
        caption: v.caption,
        videoUrl,
        thumbnailUrl: listingImg(thumbnailSeed, 720, 1280),
        durationSeconds: 15 + Math.floor(Math.random() * 45),
        status: "active",
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        shareCount: v.shareCount,
        // commentCount updated after comments seeded
      })
      .returning({ id: videos.id });
    idByKey.set(v.key, row.id);
  }
  return idByKey;
}

async function seedVideoComments(
  db: ReturnType<typeof drizzle>,
  videoIdByKey: Map<string, string>,
  userIdByKey: Map<DemoUserKey, string>,
) {
  const countsByVideo = new Map<string, number>();

  for (const c of DEMO_COMMENTS) {
    const videoId = videoIdByKey.get(c.videoKey);
    if (!videoId) continue;

    const [parent] = await db
      .insert(videoComments)
      .values({
        videoId,
        userId: userIdByKey.get(c.authorKey)!,
        content: c.content,
      })
      .returning({ id: videoComments.id });

    countsByVideo.set(videoId, (countsByVideo.get(videoId) ?? 0) + 1);

    if (c.replies) {
      for (const r of c.replies) {
        await db.insert(videoComments).values({
          videoId,
          userId: userIdByKey.get(r.authorKey)!,
          parentId: parent.id,
          content: r.content,
        });
        countsByVideo.set(videoId, (countsByVideo.get(videoId) ?? 0) + 1);
      }
    }
  }

  // Update each video's commentCount
  for (const [videoId, count] of countsByVideo.entries()) {
    await db
      .update(videos)
      .set({ commentCount: count })
      .where(sql`id = ${videoId}`);
  }
}

async function seedVideoLikes(
  db: ReturnType<typeof drizzle>,
  videoIdByKey: Map<string, string>,
  userIdByKey: Map<DemoUserKey, string>,
) {
  // Just mark a few videos as liked by buyers — pre-populated engagement
  const likers: DemoUserKey[] = ["buyer_pedro", "buyer_reylyn"];
  for (const [, videoId] of videoIdByKey.entries()) {
    for (const likerKey of likers) {
      await db
        .insert(videoLikes)
        .values({
          videoId,
          userId: userIdByKey.get(likerKey)!,
        })
        .onConflictDoNothing();
    }
  }
}

async function seedFollows(
  db: ReturnType<typeof drizzle>,
  userIdByKey: Map<DemoUserKey, string>,
) {
  const followingCountByUser = new Map<string, number>();
  const followersCountByUser = new Map<string, number>();

  for (const f of DEMO_FOLLOWS) {
    const followerId = userIdByKey.get(f.followerKey)!;
    const followingId = userIdByKey.get(f.followingKey)!;
    await db
      .insert(follows)
      .values({ followerId, followingId })
      .onConflictDoNothing();

    followingCountByUser.set(
      followerId,
      (followingCountByUser.get(followerId) ?? 0) + 1,
    );
    followersCountByUser.set(
      followingId,
      (followersCountByUser.get(followingId) ?? 0) + 1,
    );
  }

  for (const [userId, count] of followingCountByUser.entries()) {
    await db
      .update(users)
      .set({ followingCount: count })
      .where(sql`id = ${userId}`);
  }
  for (const [userId, count] of followersCountByUser.entries()) {
    await db
      .update(users)
      .set({ followersCount: count })
      .where(sql`id = ${userId}`);
  }
}

async function seedConversations(
  db: ReturnType<typeof drizzle>,
  userIdByKey: Map<DemoUserKey, string>,
  listingIdBySlug: Map<string, string>,
) {
  for (const c of DEMO_CONVERSATIONS) {
    const listingId = listingIdBySlug.get(c.listingSlug)!;
    const buyerId = userIdByKey.get(c.buyerKey)!;
    const sellerId = userIdByKey.get(c.sellerKey)!;

    const [conv] = await db
      .insert(conversations)
      .values({
        listingId,
        buyerId,
        sellerId,
        lastMessagePreview: c.messages[c.messages.length - 1].content.slice(
          0,
          120,
        ),
        lastMessageAt: new Date(
          Date.now() -
            c.messages[c.messages.length - 1].minutesAgo * 60 * 1000,
        ),
        buyerUnreadCount: 0,
        sellerUnreadCount: c.messages.filter(
          (m) => m.fromKey === c.buyerKey,
        ).length, // seller hasn't read buyer's messages yet
      })
      .returning({ id: conversations.id });

    for (const m of c.messages) {
      const senderId = userIdByKey.get(m.fromKey)!;
      const createdAt = new Date(Date.now() - m.minutesAgo * 60 * 1000);
      await db.insert(messages).values({
        conversationId: conv.id,
        senderId,
        content: m.content,
        messageType: "text",
        isRead: m.fromKey === c.sellerKey, // buyer's messages unread
        createdAt,
      });
    }
  }
}

async function seedOrders(
  db: ReturnType<typeof drizzle>,
  userIdByKey: Map<DemoUserKey, string>,
  sellerProfileIdByKey: Map<DemoUserKey, string>,
  listingIdBySlug: Map<string, string>,
) {
  const idByKey = new Map<string, string>();
  let orderSeq = 1;
  const now = Date.now();

  for (const o of DEMO_ORDERS) {
    const buyerId = userIdByKey.get(o.buyerKey)!;
    const sellerId = sellerProfileIdByKey.get(o.sellerKey)!;
    const listingSpec = DEMO_LISTINGS.find((l) => l.slug === o.listingSlug)!;
    const listingId = listingIdBySlug.get(o.listingSlug)!;

    const itemPrice = listingSpec.price;
    const shippingFee = 600;
    const platformFee = Math.round(itemPrice * 0.05);
    const totalAmount = itemPrice + shippingFee + platformFee;

    // Timeline (fake but believable)
    let paidAt: Date | null = null;
    let confirmedAt: Date | null = null;
    let shippedAt: Date | null = null;
    let deliveredAt: Date | null = null;
    let completedAt: Date | null = null;
    let escrowReleasedAt: Date | null = null;

    if (
      ["paid", "confirmed", "shipped", "delivered", "completed"].includes(
        o.status,
      )
    ) {
      paidAt = new Date(now - 5 * 24 * 60 * 60 * 1000);
    }
    if (["confirmed", "shipped", "delivered", "completed"].includes(o.status)) {
      confirmedAt = new Date(now - 4 * 24 * 60 * 60 * 1000);
    }
    if (["shipped", "delivered", "completed"].includes(o.status)) {
      shippedAt = new Date(now - 3 * 24 * 60 * 60 * 1000);
    }
    if (["delivered", "completed"].includes(o.status)) {
      deliveredAt = new Date(now - 1 * 24 * 60 * 60 * 1000);
    }
    if (o.status === "completed") {
      completedAt = new Date(now - 12 * 60 * 60 * 1000);
    }
    if (o.escrowStatus === "released") {
      escrowReleasedAt = completedAt ?? new Date();
    }

    const orderNumber = `SM-2026${String(orderSeq++).padStart(6, "0")}`;

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        buyerId,
        sellerId,
        listingId,
        itemPrice: itemPrice.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        platformFee: platformFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status: o.status,
        deliveryMethod: o.deliveryMethod,
        deliveryAddress:
          o.deliveryMethod === "shipping"
            ? "123 Sample St, Barangay 1, Cebu City, Cebu"
            : null,
        trackingNumber: o.trackingNumber ?? null,
        shippingProvider: o.trackingNumber ? "LBC Express" : null,
        paidAt,
        confirmedAt,
        shippedAt,
        deliveredAt,
        completedAt,
        escrowStatus: o.escrowStatus,
        escrowReleasedAt,
      })
      .returning({ id: orders.id });

    idByKey.set(o.key, order.id);

    // Payment record (skip for "pending" — not yet paid)
    if (o.status !== "pending") {
      await db.insert(payments).values({
        orderId: order.id,
        amount: totalAmount.toFixed(2),
        currency: "PHP",
        method: o.paymentMethod,
        provider: "paymongo",
        providerPaymentId: `demo_pay_${order.id.slice(0, 12)}`,
        status: "paid",
        paidAt,
      });
    }
  }
  return idByKey;
}

async function seedReviews(
  db: ReturnType<typeof drizzle>,
  orderIdByKey: Map<string, string>,
  userIdByKey: Map<DemoUserKey, string>,
  sellerProfileIdByKey: Map<DemoUserKey, string>,
  listingIdBySlug: Map<string, string>,
) {
  for (const r of DEMO_REVIEWS) {
    const orderId = orderIdByKey.get(r.orderKey);
    if (!orderId) continue;

    const orderSpec = DEMO_ORDERS.find((o) => o.key === r.orderKey)!;
    const listingId = listingIdBySlug.get(orderSpec.listingSlug)!;

    await db.insert(reviews).values({
      orderId,
      reviewerId: userIdByKey.get(r.buyerKey)!,
      sellerId: sellerProfileIdByKey.get(r.sellerKey)!,
      listingId,
      rating: r.rating,
      comment: r.comment,
      accuracyRating: r.rating,
      communicationRating: r.rating,
      shippingRating: r.rating,
      sellerResponse: r.response ?? null,
      sellerRespondedAt: r.response ? new Date() : null,
    });
  }
}

async function seedNotifications(
  db: ReturnType<typeof drizzle>,
  userIdByKey: Map<DemoUserKey, string>,
) {
  for (const n of DEMO_NOTIFICATIONS) {
    await db.insert(notifications).values({
      userId: userIdByKey.get(n.targetKey)!,
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      readAt: n.isRead ? new Date() : null,
      createdAt: new Date(Date.now() - n.minutesAgo * 60 * 1000),
    });
  }
}

function printSummary() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║           🎬  DEMO DATA SUMMARY                ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log(`  👥 Users:          ${DEMO_USERS.length}`);
  console.log(`  🐓 Listings:       ${DEMO_LISTINGS.length}`);
  console.log(`  🎥 Videos:         ${DEMO_VIDEOS.length}`);
  console.log(`  💬 Comments:       ${DEMO_COMMENTS.length} + replies`);
  console.log(`  📦 Orders:         ${DEMO_ORDERS.length}`);
  console.log(`  💌 Conversations:  ${DEMO_CONVERSATIONS.length}`);
  console.log(`  ⭐ Reviews:        ${DEMO_REVIEWS.length}`);
  console.log(`  🤝 Follows:        ${DEMO_FOLLOWS.length}`);
  console.log(`  🔔 Notifications:  ${DEMO_NOTIFICATIONS.length}`);
  console.log("\n  All users password: " + DEMO_PASSWORD);
  console.log("\n  Demo accounts:");
  DEMO_USERS.forEach((u) => {
    console.log(
      `    [${u.role.padEnd(7)}] ${u.phone}  ${u.displayName}`,
    );
  });
  console.log("");
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
