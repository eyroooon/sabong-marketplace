"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPatch } from "@/lib/api";
import {
  Package,
  MessageCircle,
  Heart,
  Tag,
  CreditCard,
  Bell,
  Star,
  XCircle,
  Megaphone,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";

// --- Notification type icon mapping ---

type IconComponent = typeof Package;

const NOTIFICATION_TYPE_ICONS: Record<string, { icon: IconComponent; color: string }> = {
  order_placed: { icon: Package, color: "text-blue-500" },
  order_confirmed: { icon: Package, color: "text-green-500" },
  order_shipped: { icon: Package, color: "text-orange-500" },
  order_completed: { icon: Package, color: "text-green-600" },
  order_delivered: { icon: Package, color: "text-green-600" },
  order_cancelled: { icon: XCircle, color: "text-red-500" },
  message_received: { icon: MessageCircle, color: "text-blue-500" },
  listing_favorited: { icon: Heart, color: "text-pink-500" },
  listing_published: { icon: Tag, color: "text-purple-500" },
  listing_approved: { icon: CheckCircle2, color: "text-green-500" },
  listing_rejected: { icon: XCircle, color: "text-red-500" },
  payment_received: { icon: CreditCard, color: "text-green-600" },
  review_received: { icon: Star, color: "text-yellow-500" },
  price_drop: { icon: TrendingDown, color: "text-orange-500" },
  system: { icon: Megaphone, color: "text-gray-500" },
};

function getNotificationIcon(type: string) {
  return NOTIFICATION_TYPE_ICONS[type] || { icon: Bell, color: "text-gray-400" };
}

// --- Time ago helper ---

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

// --- Navigation helper ---

function getNotificationHref(notification: any): string | null {
  const type: string = notification.type || "";
  const data = notification.data || {};

  if (type.startsWith("order_")) {
    return data.orderId ? `/orders/${data.orderId}` : "/orders";
  }
  if (type === "message_received") {
    return "/messages";
  }
  if (type === "listing_favorited") {
    return "/sell";
  }
  if (type === "listing_published" || type === "listing_approved" || type === "listing_rejected") {
    return data.listingSlug ? `/listings/${data.listingSlug}` : "/sell";
  }
  if (type === "payment_received") {
    return "/orders";
  }
  if (type === "review_received") {
    return data.listingSlug ? `/listings/${data.listingSlug}` : "/sell";
  }

  return null;
}

// --- Page component ---

export default function NotificationsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    if (!accessToken) return;
    try {
      const res = await apiGet<any>("/notifications", accessToken);
      setNotifications(res.data || []);
      setMeta(res.meta || null);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleNotificationClick(notification: any) {
    // Mark as read if unread
    if (!notification.isRead && accessToken) {
      try {
        await apiPatch(`/notifications/${notification.id}/read`, {}, accessToken);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n,
          ),
        );
      } catch {
        // ignore
      }
    }

    // Navigate to the relevant page
    const href = getNotificationHref(notification);
    if (href) {
      router.push(href);
    }
  }

  async function markAllAsRead() {
    if (!accessToken) return;
    try {
      await apiPatch("/notifications/read-all", {}, accessToken);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border p-4"
            >
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const { icon: Icon, color } = getNotificationIcon(
              notification.type,
            );
            const href = getNotificationHref(notification);

            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group w-full rounded-xl border p-4 text-left transition-colors ${
                  notification.isRead
                    ? "border-border bg-background hover:bg-muted/50"
                    : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      notification.isRead ? "bg-muted" : "bg-primary/10"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        !notification.isRead
                          ? "font-semibold text-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(notification.createdAt)}
                      </p>
                      {href && (
                        <span className="text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          View details
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            );
          })}

          {/* Pagination hint */}
          {meta?.hasMore && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Showing {notifications.length} of {meta.total} notifications
            </p>
          )}
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Bell className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            No notifications yet
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            You will be notified about orders, messages, favorites, and other
            important updates here.
          </p>
        </div>
      )}
    </div>
  );
}
