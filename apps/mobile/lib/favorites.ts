/**
 * Favorites data layer — react-query hooks wrapping /favorites API.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "./api";
import type { Listing } from "./listings";

export interface FavoriteEntry {
  id: string;
  listingId: string;
  createdAt: string;
  listing: Listing;
}

/**
 * All favorites for the current user. Returns array (not paginated).
 */
export function useMyFavorites() {
  return useQuery<FavoriteEntry[], Error>({
    queryKey: ["favorites", "my"],
    queryFn: () => apiGet<FavoriteEntry[]>("/favorites"),
    staleTime: 30_000,
  });
}

/**
 * Check whether a listing is favorited — used on listing detail screens.
 */
export function useIsFavorited(listingId: string | undefined) {
  return useQuery<{ isFavorited: boolean }, Error>({
    queryKey: ["favorites", "check", listingId],
    enabled: !!listingId,
    queryFn: () =>
      apiGet<{ isFavorited: boolean }>(`/favorites/${listingId}/check`),
    staleTime: 30_000,
  });
}

/**
 * Toggle a listing's favorite status. Takes the current state and calls
 * the appropriate endpoint. Returns the new state.
 */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation<
    { isFavorited: boolean },
    Error,
    { listingId: string; currentlyFavorited: boolean }
  >({
    mutationFn: async ({ listingId, currentlyFavorited }) => {
      if (currentlyFavorited) {
        await apiDelete(`/favorites/${listingId}`);
        return { isFavorited: false };
      } else {
        await apiPost(`/favorites/${listingId}`, {});
        return { isFavorited: true };
      }
    },
    onSuccess: (_res, { listingId }) => {
      qc.invalidateQueries({ queryKey: ["favorites", "my"] });
      qc.invalidateQueries({ queryKey: ["favorites", "check", listingId] });
      qc.invalidateQueries({ queryKey: ["users", "me", "stats"] });
    },
  });
}
