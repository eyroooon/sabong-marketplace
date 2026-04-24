// Deterministic fixtures for the mock-trial demo.
// Every run creates the same users/listings/videos — perfect for repeatable demos.

export const DEMO_PASSWORD = "Demo1234!";

export const DEMO_USERS = [
  {
    key: "admin",
    phone: "+639171111111",
    firstName: "Juan",
    lastName: "dela Cruz",
    displayName: "Admin Juan",
    role: "admin",
    isVerified: true,
    province: "Metro Manila",
    city: "Quezon City",
  },
  {
    key: "seller_tomas",
    phone: "+639172222222",
    firstName: "Tomas",
    lastName: "Breeder",
    displayName: "Mang Tomas Breeder",
    role: "seller",
    isVerified: true,
    province: "Pampanga",
    city: "Angeles",
  },
  {
    key: "seller_kelsofarm",
    phone: "+639173333333",
    firstName: "Ramon",
    lastName: "Kelso",
    displayName: "Kelso Farm PH",
    role: "seller",
    isVerified: true,
    province: "Batangas",
    city: "Lipa",
  },
  {
    key: "seller_mike",
    phone: "+639174444444",
    firstName: "Mike",
    lastName: "Sabungero",
    displayName: "Sabungero Mike",
    role: "seller",
    isVerified: false, // pending verification — admin approves this in demo
    province: "Cavite",
    city: "Dasmariñas",
  },
  {
    key: "buyer_pedro",
    phone: "+639175555555",
    firstName: "Pedro",
    lastName: "Santos",
    displayName: "Pedro Santos",
    role: "buyer",
    isVerified: true,
    province: "Cebu",
    city: "Cebu City",
  },
  {
    key: "buyer_reylyn",
    phone: "+639176666666",
    firstName: "Reylyn",
    lastName: "Cruz",
    displayName: "Reylyn Cruz",
    role: "buyer",
    isVerified: true,
    province: "Davao del Sur",
    city: "Davao City",
  },
] as const;

export type DemoUserKey = (typeof DEMO_USERS)[number]["key"];

// Real rooster / gamefowl / farm photos from Unsplash (royalty-free).
// Each is a proven-working permanent URL. Pool is hashed by seed so
// each listing gets a stable selection across reseeds.
// Verified (curl-tested) Unsplash photo IDs that return HTTP 200.
const ROOSTER_PHOTO_POOL: readonly string[] = [
  "photo-1583510383754-35fc1d1eb598",
  "photo-1585670603060-f92c1e4f3d12",
  "photo-1622997882237-e24385e6ab4a",
  "photo-1545251765-6aad90d25972",
  "photo-1709751797406-7e657b0a3897",
  "photo-1534337621606-e3df5ee0e97f",
  "photo-1598715685267-0f45367d8071",
  "photo-1569591159212-b02ea8a9f239",
  "photo-1548550023-2bdb3c5beed7",
  "photo-1612170153139-6f881ff067e0",
  "photo-1563861826100-9cb868fdbe1c",
] as const;

/**
 * Deterministic: same seed → same image. Seeds are human-readable
 * ('kelso-stag-1') so the image is consistent across reseeds.
 */
export const listingImg = (seed: string, w = 800, h = 1000): string => {
  // Simple string hash for stable index
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % ROOSTER_PHOTO_POOL.length;
  const id = ROOSTER_PHOTO_POOL[idx];
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;
};

export const avatarImg = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=b82025,f59e0b&radius=50`;

// Short, reliable, public domain MP4s for the feed placeholder videos.
// Google's publicly-hosted sample library — all under 10MB, smooth playback.
export const DEMO_VIDEOS_POOL = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
] as const;

export const DEMO_LISTINGS: Array<{
  slug: string;
  title: string;
  description: string;
  category: "rooster" | "hen" | "stag" | "pullet" | "pair" | "brood";
  breed: string;
  bloodline?: string;
  price: number;
  priceType: "fixed" | "negotiable" | "auction";
  ageMonths: number;
  weightGrams: number;
  sellerKey: DemoUserKey;
  status: "active" | "reserved" | "sold" | "draft";
  isFeatured: boolean;
  imageSeeds: string[];
  province: string;
  city: string;
  viewCount: number;
  favoriteCount: number;
}> = [
  // Mang Tomas — 6 active
  {
    slug: "kelso-stag-champion-bloodline",
    title: "Kelso Stag — Champion bloodline, 7 months",
    description:
      "Pure Kelso from champion bloodline. Sumeshuffle ang laban, malinaw ang tuka at paa. Training on-going. Ready for conditioning.",
    category: "stag",
    breed: "Kelso",
    bloodline: "Sweater Grey",
    price: 12000,
    priceType: "fixed",
    ageMonths: 7,
    weightGrams: 2200,
    sellerKey: "seller_tomas",
    status: "active",
    isFeatured: true,
    imageSeeds: ["kelso-stag-1", "kelso-stag-2", "kelso-stag-3", "kelso-stag-4"],
    province: "Pampanga",
    city: "Angeles",
    viewCount: 312,
    favoriteCount: 28,
  },
  {
    slug: "kelso-pullet-ready-to-breed",
    title: "Kelso Pullet — ready to breed",
    description:
      "Malusog, maganda ang katawan. Perfect for breeding program. Papers available upon request.",
    category: "pullet",
    breed: "Kelso",
    bloodline: "Thunderbolt",
    price: 5500,
    priceType: "negotiable",
    ageMonths: 8,
    weightGrams: 1600,
    sellerKey: "seller_tomas",
    status: "active",
    isFeatured: false,
    imageSeeds: ["kelso-pullet-1", "kelso-pullet-2", "kelso-pullet-3"],
    province: "Pampanga",
    city: "Angeles",
    viewCount: 142,
    favoriteCount: 11,
  },
  {
    slug: "asil-brood-cock-import",
    title: "Asil Brood Cock — direct import",
    description:
      "Hari ng brood program! Direct import bloodline from India. Perfect for serious breeders.",
    category: "rooster",
    breed: "Asil",
    price: 25000,
    priceType: "fixed",
    ageMonths: 18,
    weightGrams: 3200,
    sellerKey: "seller_tomas",
    status: "active",
    isFeatured: true,
    imageSeeds: ["asil-brood-1", "asil-brood-2", "asil-brood-3", "asil-brood-4"],
    province: "Pampanga",
    city: "Angeles",
    viewCount: 521,
    favoriteCount: 47,
  },
  {
    slug: "sweater-stag-bagsak-presyo",
    title: "Sweater Stag — Bagsak presyo!",
    description:
      "Legit Sweater, malinis ang background. 6 months old, training started. Quick sale.",
    category: "stag",
    breed: "Sweater",
    bloodline: "Roundhead Cross",
    price: 8500,
    priceType: "negotiable",
    ageMonths: 6,
    weightGrams: 1950,
    sellerKey: "seller_tomas",
    status: "active",
    isFeatured: false,
    imageSeeds: ["sweater-stag-1", "sweater-stag-2", "sweater-stag-3"],
    province: "Pampanga",
    city: "Angeles",
    viewCount: 89,
    favoriteCount: 6,
  },
  {
    slug: "hatch-pair-breeder-special",
    title: "Hatch Pair — breeder special",
    description:
      "Magaling magbreed, pure Hatch bloodline. Cock + hen combo. Big birds, smart cuts.",
    category: "pair",
    breed: "Hatch",
    bloodline: "Blue Hatch",
    price: 14500,
    priceType: "fixed",
    ageMonths: 14,
    weightGrams: 2800,
    sellerKey: "seller_tomas",
    status: "reserved",
    isFeatured: false,
    imageSeeds: ["hatch-pair-1", "hatch-pair-2", "hatch-pair-3"],
    province: "Pampanga",
    city: "Angeles",
    viewCount: 201,
    favoriteCount: 17,
  },
  {
    slug: "kelso-stag-second-batch",
    title: "Kelso Stag — 2nd batch of the year",
    description:
      "Another champion prospect. Training just started. Malinis na papers.",
    category: "stag",
    breed: "Kelso",
    price: 9500,
    priceType: "fixed",
    ageMonths: 6,
    weightGrams: 2050,
    sellerKey: "seller_tomas",
    status: "active",
    isFeatured: false,
    imageSeeds: ["kelso-stag-b2-1", "kelso-stag-b2-2"],
    province: "Pampanga",
    city: "Angeles",
    viewCount: 67,
    favoriteCount: 4,
  },

  // Kelso Farm — 6 active
  {
    slug: "sweater-cross-young-cock",
    title: "Sweater Cross — young cock",
    description:
      "Sweater x Hatch cross. Smart bird, great gameness. 5 months. Priced to move.",
    category: "rooster",
    breed: "Sweater",
    bloodline: "Sweater Hatch",
    price: 7500,
    priceType: "fixed",
    ageMonths: 5,
    weightGrams: 1850,
    sellerKey: "seller_kelsofarm",
    status: "active",
    isFeatured: true,
    imageSeeds: ["sweater-cross-1", "sweater-cross-2", "sweater-cross-3"],
    province: "Batangas",
    city: "Lipa",
    viewCount: 256,
    favoriteCount: 19,
  },
  {
    slug: "shamo-fresh-import-thailand",
    title: "Shamo — fresh import from Thailand",
    description:
      "Direct from Thailand breeder. Big, strong, intelligent. Limited stock.",
    category: "rooster",
    breed: "Shamo",
    price: 22000,
    priceType: "fixed",
    ageMonths: 16,
    weightGrams: 3100,
    sellerKey: "seller_kelsofarm",
    status: "active",
    isFeatured: true,
    imageSeeds: ["shamo-1", "shamo-2", "shamo-3", "shamo-4"],
    province: "Batangas",
    city: "Lipa",
    viewCount: 418,
    favoriteCount: 34,
  },
  {
    slug: "hatch-pullet-young-breeder",
    title: "Hatch Pullet — young breeder",
    description:
      "Perfect for starter breeding. Clean papers, documented bloodline.",
    category: "pullet",
    breed: "Hatch",
    price: 4800,
    priceType: "negotiable",
    ageMonths: 7,
    weightGrams: 1500,
    sellerKey: "seller_kelsofarm",
    status: "active",
    isFeatured: false,
    imageSeeds: ["hatch-pullet-1", "hatch-pullet-2"],
    province: "Batangas",
    city: "Lipa",
    viewCount: 93,
    favoriteCount: 7,
  },
  {
    slug: "roundhead-stag-ready",
    title: "Roundhead Stag — ready to condition",
    description:
      "Roundhead bloodline, solid attitude. 6 months. Perfect timing for gearing up.",
    category: "stag",
    breed: "Roundhead",
    price: 7800,
    priceType: "fixed",
    ageMonths: 6,
    weightGrams: 1900,
    sellerKey: "seller_kelsofarm",
    status: "active",
    isFeatured: false,
    imageSeeds: ["roundhead-1", "roundhead-2", "roundhead-3"],
    province: "Batangas",
    city: "Lipa",
    viewCount: 114,
    favoriteCount: 9,
  },
  {
    slug: "sweater-stag-sold",
    title: "Sweater Stag — SOLD",
    description:
      "Sold via platform. Kept for sample display.",
    category: "stag",
    breed: "Sweater",
    price: 9500,
    priceType: "fixed",
    ageMonths: 7,
    weightGrams: 2000,
    sellerKey: "seller_kelsofarm",
    status: "sold",
    isFeatured: false,
    imageSeeds: ["sweater-sold-1", "sweater-sold-2"],
    province: "Batangas",
    city: "Lipa",
    viewCount: 87,
    favoriteCount: 12,
  },
  {
    slug: "asil-pullet-import",
    title: "Asil Pullet — import bloodline",
    description:
      "Imported Asil pullet. Hard-hitting line. Great for breeding power cocks.",
    category: "pullet",
    breed: "Asil",
    price: 8500,
    priceType: "fixed",
    ageMonths: 9,
    weightGrams: 1700,
    sellerKey: "seller_kelsofarm",
    status: "active",
    isFeatured: false,
    imageSeeds: ["asil-pullet-1", "asil-pullet-2", "asil-pullet-3"],
    province: "Batangas",
    city: "Lipa",
    viewCount: 156,
    favoriteCount: 12,
  },

  // Sabungero Mike — 4 drafts (pending verification)
  {
    slug: "sweater-stag-cavite-breeder",
    title: "Sweater Stag — Cavite breeder",
    description:
      "Sweater stag from Cavite farm. New seller — verification in progress.",
    category: "stag",
    breed: "Sweater",
    price: 6500,
    priceType: "negotiable",
    ageMonths: 6,
    weightGrams: 1800,
    sellerKey: "seller_mike",
    status: "draft",
    isFeatured: false,
    imageSeeds: ["mike-sweater-1", "mike-sweater-2"],
    province: "Cavite",
    city: "Dasmariñas",
    viewCount: 0,
    favoriteCount: 0,
  },
  {
    slug: "kelso-cross-starter",
    title: "Kelso Cross — starter bird",
    description:
      "Affordable starter bird. Good for learning the sport.",
    category: "rooster",
    breed: "Kelso",
    price: 3500,
    priceType: "fixed",
    ageMonths: 5,
    weightGrams: 1700,
    sellerKey: "seller_mike",
    status: "draft",
    isFeatured: false,
    imageSeeds: ["mike-kelso-1", "mike-kelso-2"],
    province: "Cavite",
    city: "Dasmariñas",
    viewCount: 0,
    favoriteCount: 0,
  },
];

// Marketplace-linked videos reference listing slugs; community ones don't.
export const DEMO_VIDEOS: Array<{
  key: string;
  creatorKey: DemoUserKey;
  caption: string;
  type: "marketplace" | "community";
  listingSlug?: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
}> = [
  {
    key: "v_tomas_kelso_showcase",
    creatorKey: "seller_tomas",
    caption:
      "Champion Kelso Stag — 7 months, training done. DM ko kung interesado! 🐓",
    type: "marketplace",
    listingSlug: "kelso-stag-champion-bloodline",
    viewCount: 4821,
    likeCount: 234,
    shareCount: 18,
  },
  {
    key: "v_tomas_farm_tour",
    creatorKey: "seller_tomas",
    caption: "Farm tour — 200+ birds sa likod. Visit tayo sa Pampanga 🐓🐓",
    type: "community",
    viewCount: 8910,
    likeCount: 567,
    shareCount: 42,
  },
  {
    key: "v_kelsofarm_delivery",
    creatorKey: "seller_kelsofarm",
    caption: "Bagong delivery: 12 Sweater stags! Sino kukuha? 💪",
    type: "marketplace",
    listingSlug: "sweater-cross-young-cock",
    viewCount: 3240,
    likeCount: 189,
    shareCount: 11,
  },
  {
    key: "v_kelsofarm_bloodline",
    creatorKey: "seller_kelsofarm",
    caption:
      "Bloodline talk: Paano kilalanin ang pure Kelso. Save this post! 📌",
    type: "community",
    viewCount: 12430,
    likeCount: 823,
    shareCount: 167,
  },
  {
    key: "v_tomas_training",
    creatorKey: "seller_tomas",
    caption: "Training routine — Day 30. Consistency ang susi 🔑",
    type: "community",
    viewCount: 6712,
    likeCount: 412,
    shareCount: 28,
  },
  {
    key: "v_tomas_asil",
    creatorKey: "seller_tomas",
    caption:
      'Meet the champion — "Bagsak-Presyo". Watch his confidence! 👑',
    type: "marketplace",
    listingSlug: "asil-brood-cock-import",
    viewCount: 5892,
    likeCount: 387,
    shareCount: 22,
  },
  {
    key: "v_kelsofarm_sparring",
    creatorKey: "seller_kelsofarm",
    caption: "Sparring session ngayong umaga ☀️ pure power!",
    type: "community",
    viewCount: 9234,
    likeCount: 621,
    shareCount: 49,
  },
  {
    key: "v_tomas_feeding",
    creatorKey: "seller_tomas",
    caption: "Feeding schedule for peak condition — save yan! 🍚",
    type: "community",
    viewCount: 15023,
    likeCount: 1204,
    shareCount: 312,
  },
  {
    key: "v_kelsofarm_shamo",
    creatorKey: "seller_kelsofarm",
    caption: "Asil import — fresh from Thailand 🇹🇭 limited stock only",
    type: "marketplace",
    listingSlug: "shamo-fresh-import-thailand",
    viewCount: 7428,
    likeCount: 498,
    shareCount: 34,
  },
  {
    key: "v_tomas_qa",
    creatorKey: "seller_tomas",
    caption:
      "Q&A — Common newbie mistakes na dapat iwasan. Comment your questions! 💬",
    type: "community",
    viewCount: 11256,
    likeCount: 892,
    shareCount: 147,
  },
];

// Pre-seeded comments: mix of top-level + a few reply threads.
export const DEMO_COMMENTS: Array<{
  videoKey: string;
  authorKey: DemoUserKey;
  content: string;
  replies?: Array<{ authorKey: DemoUserKey; content: string }>;
}> = [
  {
    videoKey: "v_tomas_kelso_showcase",
    authorKey: "buyer_pedro",
    content: "Maganda po! Magkano pong final? Interested ako.",
    replies: [
      {
        authorKey: "seller_tomas",
        content: "PM ko po @Pedro, pwede tayong mag-usap dito din or sa chat.",
      },
    ],
  },
  {
    videoKey: "v_tomas_kelso_showcase",
    authorKey: "buyer_reylyn",
    content: "Ano pong bloodline sir?",
    replies: [
      { authorKey: "seller_tomas", content: "Sweater Grey po, pure." },
    ],
  },
  {
    videoKey: "v_tomas_kelso_showcase",
    authorKey: "buyer_pedro",
    content: "Kailan nakaready ang papers?",
  },
  {
    videoKey: "v_kelsofarm_bloodline",
    authorKey: "buyer_pedro",
    content: "Ang ganda ng explanation! Thanks sa tips sir 🙏",
  },
  {
    videoKey: "v_kelsofarm_bloodline",
    authorKey: "seller_tomas",
    content: "Legit info. Na-cover lahat ng basics. Salamat sa share!",
  },
  {
    videoKey: "v_tomas_training",
    authorKey: "buyer_reylyn",
    content: "Ilan hours per day po ang training?",
    replies: [
      {
        authorKey: "seller_tomas",
        content: "1-2 hrs, morning at afternoon. Quality > quantity.",
      },
    ],
  },
  {
    videoKey: "v_kelsofarm_sparring",
    authorKey: "buyer_pedro",
    content: "🔥🔥🔥 ang galing",
  },
  {
    videoKey: "v_tomas_feeding",
    authorKey: "buyer_reylyn",
    content: "Saved. Salamat po sa info!",
  },
  {
    videoKey: "v_tomas_asil",
    authorKey: "buyer_pedro",
    content: "Ang laki! Ready to buy if price match",
  },
  {
    videoKey: "v_kelsofarm_shamo",
    authorKey: "buyer_pedro",
    content: "Reserve niyo po please — sending DM",
  },
];

// Pre-seeded orders covering every state in the escrow flow.
export const DEMO_ORDERS: Array<{
  key: string;
  buyerKey: DemoUserKey;
  sellerKey: DemoUserKey;
  listingSlug: string;
  status:
    | "pending"
    | "paid"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "completed";
  escrowStatus: "none" | "held" | "released" | "refunded";
  paymentMethod: "gcash" | "maya" | "card" | "bank_transfer";
  trackingNumber?: string;
  deliveryMethod: "shipping" | "meetup";
}> = [
  {
    key: "o_pedro_kelso_pending",
    buyerKey: "buyer_pedro",
    sellerKey: "seller_tomas",
    listingSlug: "kelso-stag-second-batch",
    status: "pending",
    escrowStatus: "none",
    paymentMethod: "gcash",
    deliveryMethod: "shipping",
  },
  {
    key: "o_pedro_kelso_paid",
    buyerKey: "buyer_pedro",
    sellerKey: "seller_tomas",
    listingSlug: "kelso-pullet-ready-to-breed",
    status: "paid",
    escrowStatus: "held",
    paymentMethod: "gcash",
    deliveryMethod: "shipping",
  },
  {
    key: "o_pedro_sweater_shipped",
    buyerKey: "buyer_pedro",
    sellerKey: "seller_kelsofarm",
    listingSlug: "sweater-cross-young-cock",
    status: "shipped",
    escrowStatus: "held",
    paymentMethod: "maya",
    trackingNumber: "LBC-2026-000789",
    deliveryMethod: "shipping",
  },
  {
    key: "o_pedro_delivered",
    buyerKey: "buyer_pedro",
    sellerKey: "seller_tomas",
    listingSlug: "sweater-stag-bagsak-presyo",
    status: "delivered",
    escrowStatus: "held", // awaiting buyer acceptance
    paymentMethod: "gcash",
    trackingNumber: "LBC-2026-000456",
    deliveryMethod: "shipping",
  },
  {
    key: "o_reylyn_completed",
    buyerKey: "buyer_reylyn",
    sellerKey: "seller_kelsofarm",
    listingSlug: "roundhead-stag-ready",
    status: "completed",
    escrowStatus: "released",
    paymentMethod: "bank_transfer",
    trackingNumber: "LBC-2026-000123",
    deliveryMethod: "shipping",
  },
];

// Message threads — conversations attached to listings.
export const DEMO_CONVERSATIONS: Array<{
  key: string;
  buyerKey: DemoUserKey;
  sellerKey: DemoUserKey;
  listingSlug: string;
  messages: Array<{ fromKey: DemoUserKey; content: string; minutesAgo: number }>;
}> = [
  {
    key: "c_pedro_tomas_kelso",
    buyerKey: "buyer_pedro",
    sellerKey: "seller_tomas",
    listingSlug: "kelso-stag-champion-bloodline",
    messages: [
      {
        fromKey: "buyer_pedro",
        content: "Sir available pa po ba ang Kelso stag?",
        minutesAgo: 240,
      },
      {
        fromKey: "seller_tomas",
        content: "Yes po, available pa. Interested kayo?",
        minutesAgo: 230,
      },
      {
        fromKey: "buyer_pedro",
        content: "Kailan po pwede mag-ship sa Cebu?",
        minutesAgo: 225,
      },
      {
        fromKey: "seller_tomas",
        content:
          "Bukas pa po siguro, LBC via Manila–Cebu. Kasama ko na ang packaging.",
        minutesAgo: 220,
      },
    ],
  },
  {
    key: "c_pedro_kelsofarm_shipping",
    buyerKey: "buyer_pedro",
    sellerKey: "seller_kelsofarm",
    listingSlug: "sweater-cross-young-cock",
    messages: [
      {
        fromKey: "buyer_pedro",
        content:
          "Sir tanong ko lang kung tracking number nandyan na. Pagod ng maghintay 😅",
        minutesAgo: 60,
      },
      {
        fromKey: "seller_kelsofarm",
        content: "Salamat sa patience sir! Tracking #: LBC-2026-000789",
        minutesAgo: 55,
      },
      {
        fromKey: "buyer_pedro",
        content: "Received po, thanks!",
        minutesAgo: 50,
      },
    ],
  },
  {
    key: "c_reylyn_tomas_offer",
    buyerKey: "buyer_reylyn",
    sellerKey: "seller_tomas",
    listingSlug: "kelso-pullet-ready-to-breed",
    messages: [
      {
        fromKey: "buyer_reylyn",
        content: "Sir, pwede pong 4500 for the Kelso pullet?",
        minutesAgo: 120,
      },
      {
        fromKey: "seller_tomas",
        content: "Medyo mababa po yan sir. 5000 pwede ko na tanggapin.",
        minutesAgo: 115,
      },
      {
        fromKey: "buyer_reylyn",
        content: "OK po, 5000 na lang. Pwede ship sa Davao?",
        minutesAgo: 110,
      },
      {
        fromKey: "seller_tomas",
        content: "Yes po, pwede. Shipping shouldered by buyer.",
        minutesAgo: 105,
      },
    ],
  },
];

// Reviews — only on delivered/completed orders.
export const DEMO_REVIEWS: Array<{
  orderKey: string;
  buyerKey: DemoUserKey;
  sellerKey: DemoUserKey;
  rating: number; // 1-5
  comment: string;
  response?: string;
}> = [
  {
    orderKey: "o_reylyn_completed",
    buyerKey: "buyer_reylyn",
    sellerKey: "seller_kelsofarm",
    rating: 5,
    comment:
      "Super responsive seller. Bird arrived healthy, well-packed. Highly recommended!",
    response: "Salamat po ma'am! Enjoy the bird 🐓",
  },
];

// Follow graph: key → follows (array of keys)
export const DEMO_FOLLOWS: Array<{
  followerKey: DemoUserKey;
  followingKey: DemoUserKey;
}> = [
  { followerKey: "buyer_pedro", followingKey: "seller_tomas" },
  { followerKey: "buyer_pedro", followingKey: "seller_kelsofarm" },
  { followerKey: "buyer_reylyn", followingKey: "seller_tomas" },
  { followerKey: "buyer_reylyn", followingKey: "seller_kelsofarm" },
  { followerKey: "seller_tomas", followingKey: "seller_kelsofarm" },
];

// Pre-populated notifications (recent + unread) — creates a lively bell
export const DEMO_NOTIFICATIONS: Array<{
  targetKey: DemoUserKey;
  type: string;
  title: string;
  body: string;
  minutesAgo: number;
  isRead: boolean;
}> = [
  // Pedro (buyer) — 3 unread
  {
    targetKey: "buyer_pedro",
    type: "order_shipped",
    title: "Order shipped",
    body: "Your Sweater Cross is on the way — LBC-2026-000789",
    minutesAgo: 40,
    isRead: false,
  },
  {
    targetKey: "buyer_pedro",
    type: "message",
    title: "New message",
    body: "Mang Tomas replied to your chat about the Kelso stag",
    minutesAgo: 220,
    isRead: false,
  },
  {
    targetKey: "buyer_pedro",
    type: "order_delivered",
    title: "Delivery received?",
    body: "Please confirm you received order SM-2026-000004",
    minutesAgo: 30,
    isRead: false,
  },

  // Mang Tomas (seller) — 4 unread
  {
    targetKey: "seller_tomas",
    type: "new_order",
    title: "New order!",
    body: "Pedro Santos placed an order for the Kelso Pullet — ₱5,500",
    minutesAgo: 180,
    isRead: false,
  },
  {
    targetKey: "seller_tomas",
    type: "video_comment",
    title: "New comment",
    body: "Pedro commented on your Kelso showcase video",
    minutesAgo: 90,
    isRead: false,
  },
  {
    targetKey: "seller_tomas",
    type: "new_follower",
    title: "New follower",
    body: "Reylyn Cruz started following you",
    minutesAgo: 300,
    isRead: false,
  },
  {
    targetKey: "seller_tomas",
    type: "message",
    title: "New message",
    body: "Reylyn made an offer on Kelso Pullet",
    minutesAgo: 115,
    isRead: false,
  },

  // Kelso Farm (seller) — 2 unread
  {
    targetKey: "seller_kelsofarm",
    type: "new_order",
    title: "New order!",
    body: "Pedro Santos placed an order for the Sweater Cross — ₱7,500",
    minutesAgo: 400,
    isRead: false,
  },
  {
    targetKey: "seller_kelsofarm",
    type: "review_posted",
    title: "New 5-star review!",
    body: "Reylyn left a 5-star review on your Roundhead Stag",
    minutesAgo: 1440,
    isRead: false,
  },

  // Admin — 5 unread
  {
    targetKey: "admin",
    type: "verification_pending",
    title: "Seller verification pending",
    body: "Sabungero Mike submitted verification docs",
    minutesAgo: 500,
    isRead: false,
  },
  {
    targetKey: "admin",
    type: "report",
    title: "Content flagged",
    body: "A user flagged a listing for review",
    minutesAgo: 240,
    isRead: false,
  },
  {
    targetKey: "admin",
    type: "daily_summary",
    title: "Daily summary",
    body: "12 new signups, 3 new listings, ₱18,500 processed today",
    minutesAgo: 30,
    isRead: false,
  },
];

// ---------- Bloodline Groups ----------
//
// Six realistic communities: 2 regional, 2 bloodline, 2 topic.
// Demo users join a mix of them to make the UI feel lived-in.

export const DEMO_GROUPS: ReadonlyArray<{
  slug: string;
  name: string;
  description: string;
  category: "regional" | "bloodline" | "topic" | "general";
  type: "public" | "private" | "secret";
  iconEmoji: string;
  creatorKey: DemoUserKey;
  memberKeys: ReadonlyArray<DemoUserKey>;
  posts: ReadonlyArray<{
    authorKey: DemoUserKey;
    body: string;
    minutesAgo: number;
    pinned?: boolean;
    likes?: number;
    comments?: number;
  }>;
}> = [
  {
    slug: "pampanga-sabungeros",
    name: "Pampanga Sabungeros",
    description:
      "Ang opisyal na community ng mga sabungero sa Pampanga. Share stories, tips, and trades. Kapampangan breeders lang po!",
    category: "regional",
    type: "public",
    iconEmoji: "🏠",
    creatorKey: "seller_tomas",
    memberKeys: ["seller_tomas", "admin", "buyer_pedro", "buyer_reylyn"],
    posts: [
      {
        authorKey: "seller_tomas",
        body:
          "Maligayang pagdating sa Pampanga Sabungeros! Welcome sa lahat ng breeders, buyers, at enthusiasts. No betting / e-sabong content please. Respect each other.",
        minutesAgo: 60 * 24 * 7,
        pinned: true,
        likes: 47,
        comments: 12,
      },
      {
        authorKey: "seller_tomas",
        body:
          "Good morning Kapampangans 🌅 Today pwede na kayong mag-visit sa Angeles farm. 5 new Kelso chicks hatched last night!",
        minutesAgo: 45,
        likes: 23,
        comments: 5,
      },
      {
        authorKey: "buyer_pedro",
        body:
          "Sino may recommended vet sa Pampanga area? My bird has leg swelling. Tulong sa mga expert 🙏",
        minutesAgo: 180,
        likes: 4,
        comments: 8,
      },
    ],
  },
  {
    slug: "cebu-sabong-club",
    name: "Cebu Sabong Club",
    description:
      "Cebuano sabungeros, uban ta dinhi! Share news, trades, at farm updates from Visayas. Usa ra ka pamilya!",
    category: "regional",
    type: "public",
    iconEmoji: "🏝️",
    creatorKey: "buyer_pedro",
    memberKeys: ["buyer_pedro"],
    posts: [
      {
        authorKey: "buyer_pedro",
        body:
          "Welcome sa Cebu Sabong Club! Unang group para sa mga sabungero sa buong Visayas. Hinay-hinay tang magpadako 🔥",
        minutesAgo: 60 * 24 * 14,
        pinned: true,
        likes: 38,
        comments: 9,
      },
      {
        authorKey: "buyer_pedro",
        body:
          "Naay maka-recommend ug maayo nga breeder sa Cebu? I'm looking for pure Kelso stag para sa next project ko.",
        minutesAgo: 60 * 5,
        likes: 7,
        comments: 3,
      },
    ],
  },
  {
    slug: "kelso-nation",
    name: "Kelso Nation",
    description:
      "For serious Kelso breeders and enthusiasts. Discuss bloodlines, breeding pairs, and tradition. Respect the legacy of Walter Kelso.",
    category: "bloodline",
    type: "public",
    iconEmoji: "🧬",
    creatorKey: "seller_kelsofarm",
    memberKeys: [
      "seller_kelsofarm",
      "seller_tomas",
      "buyer_pedro",
      "buyer_reylyn",
      "admin",
    ],
    posts: [
      {
        authorKey: "seller_kelsofarm",
        body:
          "Welcome to Kelso Nation 🏆 Founded by breeders, for breeders. Pure Kelso bloodline lang po dito. Share pedigrees, techniques, and your farm's champions. Respect lang sa ibang breeders.",
        minutesAgo: 60 * 24 * 30,
        pinned: true,
        likes: 128,
        comments: 34,
      },
      {
        authorKey: "seller_kelsofarm",
        body:
          "Sharing my Sultan Kelso line: 4 generations of pure genetics traced back to 1988. This is why pedigree matters. Ibang kaangasan kapag straight line.",
        minutesAgo: 60 * 8,
        likes: 54,
        comments: 12,
      },
      {
        authorKey: "seller_tomas",
        body:
          "Thanks Kuya Ramon for hosting this group. Naipa-share ko yung breeding pair ko from last season — incredible hatch rate.",
        minutesAgo: 60 * 4,
        likes: 18,
        comments: 3,
      },
    ],
  },
  {
    slug: "sweater-society",
    name: "Sweater Society",
    description:
      "All things Sweater bloodline. Breeding pairs, fighting style discussions, and tradition from the Madigin line.",
    category: "bloodline",
    type: "public",
    iconEmoji: "💎",
    creatorKey: "seller_tomas",
    memberKeys: ["seller_tomas", "seller_kelsofarm", "buyer_reylyn"],
    posts: [
      {
        authorKey: "seller_tomas",
        body:
          "Sweater Society — founded for the appreciation of the classic Madigin bloodline. Ipagmamalaki natin ang heritage.",
        minutesAgo: 60 * 24 * 21,
        pinned: true,
        likes: 72,
        comments: 15,
      },
      {
        authorKey: "seller_tomas",
        body:
          "What's everyone's preferred Sweater × Kelso cross ratio? I've had best results with 50/50. Sharing my notes.",
        minutesAgo: 60 * 12,
        likes: 29,
        comments: 8,
      },
    ],
  },
  {
    slug: "feeding-and-nutrition",
    name: "Feeding & Nutrition Tips",
    description:
      "Share feeding schedules, feed brands, supplements, at naturally-prepared meals. Healthy bird = champion bird.",
    category: "topic",
    type: "public",
    iconEmoji: "🌾",
    creatorKey: "admin",
    memberKeys: [
      "admin",
      "seller_tomas",
      "seller_kelsofarm",
      "seller_mike",
      "buyer_pedro",
      "buyer_reylyn",
    ],
    posts: [
      {
        authorKey: "admin",
        body:
          "Welcome to Feeding & Nutrition Tips! 🌾 Share your feeding schedule, questions, and what's working for your farm. Tagalog or English — lahat okay!",
        minutesAgo: 60 * 24 * 10,
        pinned: true,
        likes: 91,
        comments: 22,
      },
      {
        authorKey: "seller_tomas",
        body:
          "My morning mix for 6-month stags: 2 parts cracked corn, 1 part wheat, 1 part feed pellet, splash of apple cider vinegar in water. Simple lang pero consistent.",
        minutesAgo: 60 * 6,
        likes: 41,
        comments: 14,
      },
      {
        authorKey: "buyer_reylyn",
        body:
          "Tanong lang po — ilang beses po dapat i-supplement ng vitamins per week for 4-month pullets? First time ko po 🙏",
        minutesAgo: 60 * 3,
        likes: 2,
        comments: 6,
      },
    ],
  },
  {
    slug: "new-sabungero-support",
    name: "New Sabungero Support",
    description:
      "Para sa mga baguhan! Ask questions, post your first pair, get guidance from experienced breeders. Walang hanging question.",
    category: "topic",
    type: "public",
    iconEmoji: "🔰",
    creatorKey: "admin",
    memberKeys: ["admin", "buyer_reylyn", "seller_mike", "seller_tomas"],
    posts: [
      {
        authorKey: "admin",
        body:
          "New Sabungero Support — safe space para sa mga nagsisimula. Walang judgment. Tanong lang, tulungan kita.",
        minutesAgo: 60 * 24 * 14,
        pinned: true,
        likes: 56,
        comments: 11,
      },
      {
        authorKey: "buyer_reylyn",
        body:
          "First time breeder here 🔰 Just bought my first pair last week. Ano po magandang gawin sa first 30 days? Any pitfalls to watch?",
        minutesAgo: 60 * 18,
        likes: 12,
        comments: 19,
      },
      {
        authorKey: "seller_tomas",
        body:
          "Welcome sis! Tips para sa first month: 1) regular deworming 2) clean water daily 3) observe lang muna, don't over-feed. Mas importante ang pasensya than flash diet.",
        minutesAgo: 60 * 17,
        likes: 24,
        comments: 3,
      },
    ],
  },
];

