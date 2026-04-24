/**
 * Listings data layer — react-query hooks wrapping the NestJS /listings API.
 * Mirrors apps/web/src/lib/listings.ts in spirit.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

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

// ───────────────────────────────────────────────────────────────────────────
// Seller-owned listing hooks (require auth)
// ───────────────────────────────────────────────────────────────────────────

/**
 * Fetch the current seller's own listings across all statuses.
 * API returns { data: Listing[], pagination } — same shape as /listings but
 * scoped to the authenticated seller.
 */
export function useMyListings() {
  return useQuery<BrowseResponse, Error>({
    queryKey: ["listings", "my"],
    queryFn: () => apiGet<BrowseResponse>("/listings/my"),
    staleTime: 15_000,
  });
}

export interface CreateListingInput {
  title: string;
  description?: string;
  category: string;
  breed?: string;
  bloodline?: string;
  ageMonths?: number;
  weightKg?: number;
  color?: string;
  legColor?: string;
  fightingStyle?: string;
  sireInfo?: string;
  damInfo?: string;
  vaccinationStatus?: string;
  price: number;
  priceType?: "fixed" | "negotiable" | "auction";
  locationProvince: string;
  locationCity: string;
  shippingAvailable?: boolean;
  shippingAreas?: string;
  shippingFee?: number;
}

export interface CreateListingResponse {
  id: string;
  slug: string;
  title: string;
  status: Listing["status"];
}

/**
 * Create a new listing (starts in 'draft' status — seller must publish it).
 * Returns the created listing's id + slug so the caller can immediately upload
 * images or navigate to the detail screen.
 */
export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation<CreateListingResponse, Error, CreateListingInput>({
    mutationFn: (input) =>
      apiPost<CreateListingResponse>("/listings", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings", "my"] });
      qc.invalidateQueries({ queryKey: ["users", "me", "stats"] });
    },
  });
}

/**
 * Update any listing fields. Accepts a Partial<CreateListingInput>.
 */
export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation<
    { id: string },
    Error,
    { id: string; patch: Partial<CreateListingInput> }
  >({
    mutationFn: ({ id, patch }) =>
      apiPatch<{ id: string }>(`/listings/${id}`, patch),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["listings", "my"] });
      qc.invalidateQueries({ queryKey: ["listings", "detail"] });
      qc.invalidateQueries({ queryKey: ["listings", "detail", id] });
    },
  });
}

/**
 * Transition a listing from draft → active (publishes it so buyers see it).
 * Also invalidates /users/me/stats so the dashboard's Active Listings
 * counter updates immediately (not after the 15-second poll).
 */
export function usePublishListing() {
  const qc = useQueryClient();
  return useMutation<{ id: string }, Error, { id: string }>({
    mutationFn: ({ id }) =>
      apiPost<{ id: string }>(`/listings/${id}/publish`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings", "my"] });
      qc.invalidateQueries({ queryKey: ["users", "me", "stats"] });
    },
  });
}

/**
 * Move a listing to archived (hides from marketplace but preserves history).
 * Also invalidates /users/me/stats so the dashboard's Active Listings
 * counter decrements immediately.
 */
export function useArchiveListing() {
  const qc = useQueryClient();
  return useMutation<{ id: string }, Error, { id: string }>({
    mutationFn: ({ id }) =>
      apiPost<{ id: string }>(`/listings/${id}/archive`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings", "my"] });
      qc.invalidateQueries({ queryKey: ["users", "me", "stats"] });
    },
  });
}

/**
 * Hard-delete a listing. Only allowed for drafts in most cases.
 */
export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, { id: string }>({
    mutationFn: ({ id }) => apiDelete<{ ok: boolean }>(`/listings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings", "my"] });
      qc.invalidateQueries({ queryKey: ["users", "me", "stats"] });
    },
  });
}

export interface LocalImage {
  /** Local file uri from expo-image-picker (file:// or ph://). */
  uri: string;
  /** MIME type, e.g. "image/jpeg". Best-effort inferred from uri. */
  type?: string;
  /** Filename for the upload (defaults to last path component). */
  name?: string;
}

/**
 * Upload up to N images for a listing. Uses multipart/form-data — the global
 * apiPost helper strips JSON headers when given a FormData body.
 */
export function useUploadListingImages() {
  const qc = useQueryClient();
  return useMutation<
    { uploaded: number },
    Error,
    { listingId: string; images: LocalImage[] }
  >({
    mutationFn: ({ listingId, images }) => {
      const form = new FormData();
      images.forEach((img, idx) => {
        const name = img.name || img.uri.split("/").pop() || `image-${idx}.jpg`;
        const type =
          img.type ||
          (name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
        form.append("images", {
          uri: img.uri,
          name,
          type,
        } as unknown as Blob);
      });
      return apiPost<{ uploaded: number }>(
        `/listings/${listingId}/images`,
        form,
      );
    },
    onSuccess: (_res, { listingId }) => {
      qc.invalidateQueries({ queryKey: ["listings", "my"] });
      qc.invalidateQueries({ queryKey: ["listings", "detail", listingId] });
    },
  });
}

/**
 * Delete a specific image from a listing.
 */
export function useDeleteListingImage() {
  const qc = useQueryClient();
  return useMutation<
    { ok: boolean },
    Error,
    { listingId: string; imageId: string }
  >({
    mutationFn: ({ listingId, imageId }) =>
      apiDelete<{ ok: boolean }>(`/listings/${listingId}/images/${imageId}`),
    onSuccess: (_res, { listingId }) => {
      qc.invalidateQueries({ queryKey: ["listings", "my"] });
      qc.invalidateQueries({ queryKey: ["listings", "detail"] });
    },
  });
}
