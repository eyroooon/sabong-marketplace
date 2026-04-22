/**
 * Reviews data layer — react-query hooks wrapping /reviews endpoints.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "./api";

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  sellerId: string;
  listingId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  accuracyRating: number | null;
  communicationRating: number | null;
  shippingRating: number | null;
  sellerResponse: string | null;
  sellerRespondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  orderId: string;
  rating: number;
  title?: string;
  comment?: string;
  accuracyRating?: number;
  communicationRating?: number;
  shippingRating?: number;
}

export function useOrderReview(orderId: string | null | undefined) {
  return useQuery<Review | null, Error>({
    queryKey: ["review-order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      try {
        return await apiGet<Review>(`/reviews/order/${orderId}`);
      } catch {
        return null;
      }
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation<Review, Error, CreateReviewInput>({
    mutationFn: (input) => apiPost<Review>("/reviews", input),
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: ["review-order", review.orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useRespondToReview(reviewId: string, orderId: string) {
  const qc = useQueryClient();
  return useMutation<Review, Error, { response: string }>({
    mutationFn: (input) =>
      apiPatch<Review>(`/reviews/${reviewId}/respond`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review-order", orderId] });
    },
  });
}
