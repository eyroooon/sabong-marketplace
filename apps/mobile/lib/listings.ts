/**
 * Listings data layer — react-query hooks wrapping the NestJS /listings API.
 * Mirrors apps/web/src/lib/listings.ts in spirit.
 */
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiGet } from "./api";

export interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  breed: string | null;
  bloodline: string | null;
  ageMonths: number | null;
  weightKg: string | null;
  color: string | null;
  legColor: string | null;
  fightingStyle: string | null;
  price: string;
  priceType: "fixed" | "negotiable" | "auction";
  minBid: string | null;
  locationProvince: string | null;
  locationCity: string | null;
  shippingAvailable: boolean;
  shippingAreas: string | null;
  shippingFee: string | null;
  status: "draft" | "active" | "reserved" | "sold" | "archived";
  viewCount: number;
  isFeatured: boolean;
  primaryImage?: string | null;
  sellerVerified?: boolean;
  sellerName?: string | null;
  createdAt: string;
  publishedAt?: string | null;
}

export interface ListingDetail extends Listing {
  sireInfo: string | null;
  damInfo: string | null;
  vaccinationStatus: string | null;
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  seller: {
    id: string;
    userId: string;
    farmName: string | null;
    avgRating: string | null;
    verificationStatus: string | null;
    farmProvince: string | null;
    farmCity: string | null;
  } | null;
}

export interface BrowseResponse {
  data: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BrowseFilters {
  search?: string;
  category?: string;
  breed?: string;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
}

function buildQueryString(
  filters: BrowseFilters & { page?: number; limit?: number },
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    const paramKey =
      key === "minPrice" ? "min_price" : key === "maxPrice" ? "max_price" : key;
    params.set(paramKey, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Infinite paginated browse with filters.
 * Uses react-query's infinite query so the FlatList can load next page on end-reached.
 */
export function useBrowseListings(filters: BrowseFilters = {}) {
  return useInfiniteQuery<BrowseResponse, Error>({
    queryKey: ["listings", "browse", filters],
    queryFn: ({ pageParam = 1 }) =>
      apiGet<BrowseResponse>(
        `/listings${buildQueryString({ ...filters, page: pageParam as number, limit: 20 })}`,
        { auth: false },
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 30_000,
  });
}

export function useFeaturedListings() {
  return useQuery<{ data: Listing[] }, Error>({
    queryKey: ["listings", "featured"],
    queryFn: () =>
      apiGet<{ data: Listing[] }>("/listings/featured", { auth: false }),
    staleTime: 60_000,
  });
}

export function useListingBySlug(slug: string | undefined) {
  return useQuery<ListingDetail, Error>({
    queryKey: ["listings", "detail", slug],
    enabled: !!slug,
    queryFn: () =>
      apiGet<ListingDetail>(`/listings/${slug}`, { auth: false }),
  });
}

/** Helper: format ₱ price from string (API serializes numeric as string) */
export function formatPeso(value: string | null | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

/** Human-readable location */
export function formatLocation(
  province: string | null,
  city: string | null,
): string | null {
  if (province && city) return `${city}, ${province}`;
  return province || city || null;
}
