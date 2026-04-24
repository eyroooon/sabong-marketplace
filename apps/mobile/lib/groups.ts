/**
 * Groups data layer — react-query hooks.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost } from "./api";

export type GroupCategory = "regional" | "bloodline" | "topic" | "general";

export interface Group {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: GroupCategory;
  type: "public" | "private" | "secret";
  iconEmoji: string | null;
  coverImageUrl: string | null;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  role: string | null;
  pendingApproval?: boolean;
  createdAt?: string;
}

export interface GroupPost {
  id: string;
  body: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  pinnedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
}

export function useGroups(params: { category?: GroupCategory | "all"; q?: string } = {}) {
  const { category, q } = params;
  return useQuery<Group[], Error>({
    queryKey: ["groups", "list", category ?? "all", q ?? ""],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (category && category !== "all") qs.set("category", category);
      if (q) qs.set("q", q);
      const suffix = qs.toString() ? `?${qs}` : "";
      return apiGet<Group[]>(`/groups${suffix}`);
    },
  });
}

export function useMyGroups() {
  return useQuery<Group[], Error>({
    queryKey: ["groups", "mine"],
    queryFn: () => apiGet<Group[]>("/groups/mine"),
  });
}

export function useGroup(slug: string | null) {
  return useQuery<Group, Error>({
    queryKey: ["groups", "detail", slug],
    enabled: !!slug,
    queryFn: () => apiGet<Group>(`/groups/${slug}`),
  });
}

export function useGroupPosts(groupId: string | null) {
  return useQuery<GroupPost[], Error>({
    queryKey: ["groups", "posts", groupId],
    enabled: !!groupId,
    queryFn: () => apiGet<GroupPost[]>(`/groups/${groupId}/posts`),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation<{ status: string }, Error, { groupId: string }>({
    mutationFn: ({ groupId }) =>
      apiPost<{ status: string }>(`/groups/${groupId}/join`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, { groupId: string }>({
    mutationFn: ({ groupId }) =>
      apiPost<{ ok: boolean }>(`/groups/${groupId}/leave`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useCreateGroupPost() {
  const qc = useQueryClient();
  return useMutation<
    GroupPost,
    Error,
    { groupId: string; body: string; images?: string[] }
  >({
    mutationFn: ({ groupId, body, images }) =>
      apiPost<GroupPost>(`/groups/${groupId}/posts`, { body, images }),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ["groups", "posts", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", "detail"] });
    },
  });
}
