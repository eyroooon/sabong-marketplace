export type ListingCategory =
  | "rooster"
  | "hen"
  | "stag"
  | "pullet"
  | "pair"
  | "brood";

export type ListingStatus =
  | "draft"
  | "active"
  | "sold"
  | "reserved"
  | "archived";

export type PriceType = "fixed" | "negotiable" | "auction";

export type ShippingArea = "local" | "regional" | "nationwide";

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  slug: string;
  category: ListingCategory;
  breed: string | null;
  bloodline: string | null;
  ageMonths: number | null;
  weightKg: number | null;
  color: string | null;
  legColor: string | null;
  fightingStyle: string | null;
  sireInfo: string | null;
  damInfo: string | null;
  pedigreeUrl: string | null;
  vaccinationStatus: "vaccinated" | "not_vaccinated" | "partial" | null;
  healthCertUrl: string | null;
  price: number;
  priceType: PriceType;
  minBid: number | null;
  status: ListingStatus;
  isFeatured: boolean;
  featuredUntil: string | null;
  locationProvince: string;
  locationCity: string;
  shippingAvailable: boolean;
  shippingAreas: ShippingArea;
  shippingFee: number | null;
  meetupAvailable: boolean;
  viewCount: number;
  inquiryCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface ListingImage {
  id: string;
  listingId: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ListingCard {
  id: string;
  title: string;
  slug: string;
  category: ListingCategory;
  breed: string | null;
  bloodline: string | null;
  ageMonths: number | null;
  weightKg: number | null;
  price: number;
  priceType: PriceType;
  locationProvince: string;
  locationCity: string;
  primaryImage: string | null;
  seller: {
    id: string;
    farmName: string;
    avgRating: number;
    isVerified: boolean;
  };
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
}
