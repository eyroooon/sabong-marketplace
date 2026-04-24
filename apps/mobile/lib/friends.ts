/**
 * Friends data layer — react-query hooks wrapping /friends + /users endpoints.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost } from "./api";

export interface FriendUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  province?: string | null;
  isVerified?: boolean;
  friendsSince?: string;
  requestedAt?: string;
  followersCount?: number;
}

export type FriendStatus =
  | "none"
  | "friends"
  | "request_sent"
  | "request_received"
  | "blocked"
  | "declined";

export function useFriends() {
  return useQuery<FriendUser[], Error>({
    queryKey: ["friends", "list"],
    queryFn: () => apiGet<FriendUser[]>("/friends"),
  });
}

export function useIncomingRequests() {
  return useQuery<FriendUser[], Error>({
    queryKey: ["friends", "incoming"],
    queryFn: () => apiGet<FriendUser[]>("/friends/requests/incoming"),
  });
}

export function useOutgoingRequests() {
  return useQuery<FriendUser[], Error>({
    queryKey: ["friends", "outgoing"],
    queryFn: () => apiGet<FriendUser[]>("/friends/requests/outgoing"),
  });
}

export function useFriendSuggestions() {
  return useQuery<FriendUser[], Error>({
    queryKey: ["friends", "suggestions"],
    queryFn: () => apiGet<FriendUser[]>("/users/suggestions"),
  });
}

export function useFriendStatus(userId: string | null) {
  return useQuery<{ status: FriendStatus }, Error>({
    queryKey: ["friends", "status", userId],
    enabled: !!userId,
    queryFn: () => apiGet<{ status: FriendStatus }>(`/friends/status/${userId}`),
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, { userId: string }>({
    mutationFn: (input) => apiPost<{ ok: boolean }>("/friends/request", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useAcceptFriend() {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, { userId: string }>({
    mutationFn: (input) => apiPost<{ ok: boolean }>("/friends/accept", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useDeclineFriend() {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, { userId: string }>({
    mutationFn: (input) => apiPost<{ ok: boolean }>("/friends/decline", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, { userId: string }>({
    mutationFn: (input) => apiPost<{ ok: boolean }>("/friends/remove", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}
