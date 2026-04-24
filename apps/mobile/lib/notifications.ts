/**
 * Notifications data layer — list + unread count + mark-read actions.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPatch } from "./api";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  data: Notification[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Paginated notifications list. Uses react-query infinite query so the
 * FlatList can load-more on end-reached.
 */
export function useNotifications() {
  return useInfiniteQuery<NotificationsPage, Error>({
    queryKey: ["notifications", "list"],
    queryFn: ({ pageParam = 1 }) =>
      apiGet<NotificationsPage>(
        `/notifications?page=${pageParam}&limit=20`,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    staleTime: 10_000,
  });
}

/**
 * Unread badge count — auto-refetches every 30s for semi-realtime.
 */
export function useUnreadCount() {
  return useQuery<{ count: number }, Error>({
    queryKey: ["notifications", "unread"],
    queryFn: () => apiGet<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

/**
 * Mark a single notification as read.
 */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<Notification, Error, { id: string }>({
    mutationFn: ({ id }) =>
      apiPatch<Notification>(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", "list"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
      qc.invalidateQueries({ queryKey: ["users", "me", "stats"] });
    },
  });
}

/**
 * Mark all unread notifications as read.
 */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<{ count: number }, Error, void>({
    mutationFn: () =>
      apiPatch<{ count: number }>("/notifications/read-all", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", "list"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
      qc.invalidateQueries({ queryKey: ["users", "me", "stats"] });
    },
  });
}

/**
 * Icon name for a given notification type. Centralised so the list screen
 * and any badge overlays share the mapping.
 */
export function iconForNotificationType(type: string): string {
  if (type.startsWith("order_")) return "cube-outline";
  if (type.startsWith("payment_")) return "card-outline";
  if (type === "escrow_released") return "checkmark-done-circle";
  if (type === "escrow_disputed") return "alert-circle";
  if (type.startsWith("message_")) return "chatbubbles-outline";
  if (type.startsWith("friend_")) return "people-outline";
  if (type === "review_posted") return "star-outline";
  if (type.startsWith("verification_")) return "shield-checkmark-outline";
  if (type.startsWith("listing_")) return "pricetag-outline";
  if (type.startsWith("group_")) return "people-circle-outline";
  if (type === "broadcast") return "megaphone-outline";
  return "notifications-outline";
}

/**
 * Deep-link target for a notification — nullable when the notification is
 * informational and has no associated screen.
 */
export function routeForNotification(n: Notification): string | null {
  const data = n.data ?? {};
  if (n.type.startsWith("order_")) {
    const id = typeof data.orderId === "string" ? data.orderId : null;
    return id ? `/order/${id}` : "/orders";
  }
  if (n.type.startsWith("message_")) {
    const convId =
      typeof data.conversationId === "string" ? data.conversationId : null;
    return convId ? `/messages/${convId}` : "/messages";
  }
  if (n.type === "review_posted") {
    const orderId = typeof data.orderId === "string" ? data.orderId : null;
    return orderId ? `/order/${orderId}` : null;
  }
  if (n.type.startsWith("listing_")) {
    const slug = typeof data.slug === "string" ? data.slug : null;
    return slug ? `/listing/${slug}` : null;
  }
  if (n.type.startsWith("friend_")) return "/friends";
  if (n.type.startsWith("verification_")) return "/seller/verification";
  if (n.type.startsWith("group_")) {
    const slug = typeof data.groupSlug === "string" ? data.groupSlug : null;
    return slug ? `/groups/${slug}` : "/groups";
  }
  return null;
}
