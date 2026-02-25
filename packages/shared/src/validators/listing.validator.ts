import { z } from "zod";

const listingCategories = [
  "rooster",
  "hen",
  "stag",
  "pullet",
  "pair",
  "brood",
] as const;

const priceTypes = ["fixed", "negotiable", "auction"] as const;
const shippingAreas = ["local", "regional", "nationwide"] as const;
const vaccinationStatuses = ["vaccinated", "not_vaccinated", "partial"] as const;

export const createListingSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  category: z.enum(listingCategories),
  breed: z.string().max(100).optional(),
  bloodline: z.string().max(200).optional(),
  ageMonths: z.number().int().min(0).max(120).optional(),
  weightKg: z.number().min(0).max(20).optional(),
  color: z.string().max(50).optional(),
  legColor: z.string().max(50).optional(),
  fightingStyle: z.string().max(100).optional(),
  sireInfo: z.string().max(200).optional(),
  damInfo: z.string().max(200).optional(),
  vaccinationStatus: z.enum(vaccinationStatuses).optional(),
  price: z.number().min(1).max(10000000),
  priceType: z.enum(priceTypes).default("fixed"),
  minBid: z.number().min(1).optional(),
  locationProvince: z.string().min(1).max(100),
  locationCity: z.string().min(1).max(100),
  shippingAvailable: z.boolean().default(false),
  shippingAreas: z.enum(shippingAreas).default("local"),
  shippingFee: z.number().min(0).optional(),
  meetupAvailable: z.boolean().default(true),
});

export const updateListingSchema = createListingSchema.partial();

export const listingFiltersSchema = z.object({
  category: z.enum(listingCategories).optional(),
  breed: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  province: z.string().optional(),
  minAge: z.coerce.number().min(0).optional(),
  maxAge: z.coerce.number().min(0).optional(),
  minWeight: z.coerce.number().min(0).optional(),
  maxWeight: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingFilters = z.infer<typeof listingFiltersSchema>;
