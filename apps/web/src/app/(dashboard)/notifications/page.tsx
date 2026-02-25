"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPatch } from "@/lib/api";

const NOTIFICATION_ICONS: Record<string, string> = {
  order_placed: "🛒",
  order_confirmed: "✅",
  order_shipped: "🚚",
  order_delivered: "📦",
  order_completed: "🎉",
  order_cancelled: "❌",
  payment_received: "💰",
  message_received: "💬",
  review_received: "⭐",
  listing_approved: "✅",
  listing_rejected: "🚫",
  price_drop: "📉",
  system: "📢",
};

export default function NotificationsPage() {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    if (!accessToken) return;
    try {
      const res = await apiGet("/notifications", accessToken);
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    if (!accessToken) return;
    try {
      await apiPatch(`/notifications/${id}/read`, {}, accessToken);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // ignore
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
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border p-4">
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
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                notification.isRead
                  ? "border-border bg-background"
                  : "border-primary/20 bg-primary/5 hover:bg-primary/10"
              }`}
            >
              <div className="flex gap-3">
                <span className="text-2xl">
                  {NOTIFICATION_ICONS[notification.type] || "📢"}
                </span>
                <div className="flex-1">
                  <p className={`text-sm ${!notification.isRead ? "font-semibold" : ""}`}>
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {notification.body}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <svg className="mx-auto h-16 w-16 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p className="mt-4 text-lg text-muted-foreground">No notifications</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;ll be notified about orders, messages, and updates here.
          </p>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}
