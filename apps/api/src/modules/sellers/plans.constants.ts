export const SELLER_PLANS = {
  free: {
    name: "Free",
    price: 0,
    maxActiveListings: 5,
    featuredListingsPerMonth: 0,
    canPostVideos: true,
    maxVideosPerMonth: 3,
    commissionRate: 0.05, // 5% platform fee
    verifiedBadge: false,
    prioritySupport: false,
    analyticsAccess: false,
  },
  basic: {
    name: "Basic",
    price: 299, // PHP per month
    maxActiveListings: 25,
    featuredListingsPerMonth: 2,
    canPostVideos: true,
    maxVideosPerMonth: 15,
    commissionRate: 0.04, // 4% platform fee
    verifiedBadge: true,
    prioritySupport: false,
    analyticsAccess: true,
  },
  pro: {
    name: "Pro",
    price: 999, // PHP per month
    maxActiveListings: -1, // unlimited
    featuredListingsPerMonth: 10,
    canPostVideos: true,
    maxVideosPerMonth: -1, // unlimited
    commissionRate: 0.03, // 3% platform fee
    verifiedBadge: true,
    prioritySupport: true,
    analyticsAccess: true,
  },
} as const;

export type PlanType = keyof typeof SELLER_PLANS;
