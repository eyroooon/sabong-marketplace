/**
 * Seller data layer — react-query hooks wrapping /sellers and /users/me/stats.
 *
 * Used by the mobile seller dashboard and verification flows. Mirrors the
 * web patterns in apps/web/src/app/(dashboard)/dashboard/page.tsx and
 * apps/web/src/app/(dashboard)/sell/page.tsx.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "./api";
import type { LocalImage } from "./listings";

export interface MyStats {
  activeListings: number;
  pendingOrders: number;
  unreadNotifications: number;
  favorites: number;
  totalSales: number | null;
  avgRating: string | null;
}

export interface SellerProfile {
  id: string;
  userId: string;
  farmName: string | null;
  farmDescription: string | null;
  farmProvince: string | null;
  farmCity: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  businessType: string | null;
  governmentIdUrl: string | null;
  farmPermitUrl: string | null;
  verificationStatus: "pending" | "verified" | "rejected" | null;
  verifiedAt: string | null;
  totalSales: number;
  avgRating: string;
  ratingCount: number;
  responseRate: string | null;
  responseTime: string | null;
  plan: "free" | "basic" | "pro";
  isFeaturedBreeder: boolean;
  createdAt: string;
}

export type PlanTier = "free" | "basic" | "pro";

export interface MyPlan {
  plan: PlanTier;
  planDetails: {
    key: PlanTier;
    name: string;
    priceMonthly: number;
    commission: number;
    benefits: string[];
  };
  usage: {
    activeListings: number;
    maxActiveListings: number;
    videosThisMonth: number;
    maxVideosPerMonth: number;
  };
}

/**
 * Dashboard stats: active listings, pending orders, unread notifications,
 * favorites, and (for sellers) totalSales + avgRating.
 */
export function useMyStats() {
  return useQuery<MyStats, Error>({
    queryKey: ["users", "me", "stats"],
    queryFn: () => apiGet<MyStats>("/users/me/stats"),
    staleTime: 15_000,
  });
}

/**
 * Full seller profile (farm info, social links, verification docs & status).
 * Returns 404 if the user has never registered as a seller.
 */
export function useSellerProfile() {
  return useQuery<SellerProfile | null, Error>({
    queryKey: ["sellers", "me"],
    queryFn: async () => {
      try {
        return await apiGet<SellerProfile>("/sellers/me");
      } catch (err) {
        // 404 = user is not a seller yet; swallow so UI can show CTA
        const msg =
          err instanceof Error ? err.message.toLowerCase() : String(err);
        if (msg.includes("not found") || msg.includes("404")) return null;
        throw err;
      }
    },
    staleTime: 30_000,
  });
}

/**
 * Current plan tier + usage counters.
 */
export function useMyPlan() {
  return useQuery<MyPlan | null, Error>({
    queryKey: ["sellers", "me", "plan"],
    queryFn: async () => {
      try {
        return await apiGet<MyPlan>("/sellers/me/plan");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message.toLowerCase() : String(err);
        if (msg.includes("not found") || msg.includes("404")) return null;
        throw err;
      }
    },
    staleTime: 60_000,
  });
}

export interface RegisterSellerInput {
  farmName: string;
  farmProvince: string;
  farmCity: string;
  farmDescription?: string;
  businessType?: "individual" | "registered_farm" | "corporation";
}

/**
 * Upgrade a buyer to seller. Creates a draft seller_profiles row and bumps
 * the user's role to "seller".
 */
export function useRegisterAsSeller() {
  const qc = useQueryClient();
  return useMutation<SellerProfile, Error, RegisterSellerInput>({
    mutationFn: (input) => apiPost<SellerProfile>("/sellers/register", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sellers", "me"] });
      qc.invalidateQueries({ queryKey: ["users", "me", "stats"] });
    },
  });
}

export interface UpdateSellerProfileInput {
  farmName?: string;
  farmDescription?: string;
  farmProvince?: string;
  farmCity?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
}

export function useUpdateSellerProfile() {
  const qc = useQueryClient();
  return useMutation<SellerProfile, Error, UpdateSellerProfileInput>({
    mutationFn: (patch) =>
      apiPatch<SellerProfile>("/sellers/me", patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sellers", "me"] });
    },
  });
}

/**
 * Upload government ID + (optional) farm permit for seller verification.
 * Sets verificationStatus → "pending" server-side so an admin can review.
 */
export function useSubmitSellerVerification() {
  const qc = useQueryClient();
  return useMutation<
    SellerProfile,
    Error,
    { governmentId: LocalImage; farmPermit?: LocalImage }
  >({
    mutationFn: ({ governmentId, farmPermit }) => {
      const form = new FormData();
      const gidName =
        governmentId.name || governmentId.uri.split("/").pop() || "gov-id.jpg";
      const gidType =
        governmentId.type ||
        (gidName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
      form.append("governmentId", {
        uri: governmentId.uri,
        name: gidName,
        type: gidType,
      } as unknown as Blob);

      if (farmPermit) {
        const fpName =
          farmPermit.name ||
          farmPermit.uri.split("/").pop() ||
          "farm-permit.jpg";
        const fpType =
          farmPermit.type ||
          (fpName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
        form.append("farmPermit", {
          uri: farmPermit.uri,
          name: fpName,
          type: fpType,
        } as unknown as Blob);
      }

      return apiPost<SellerProfile>("/sellers/me/documents", form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sellers", "me"] });
    },
  });
}
