"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingOrders: 0,
    unreadNotifications: 0,
    favorites: 0,
    totalSales: null as number | null,
    avgRating: null as string | null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    apiGet<any>("/users/me/stats", accessToken)
      .then((res) => {
        setStats({
          activeListings: res.activeListings ?? 0,
          pendingOrders: res.pendingOrders ?? 0,
          unreadNotifications: res.unreadNotifications ?? 0,
          favorites: res.favorites ?? 0,
          totalSales: res.totalSales ?? null,
          avgRating: res.avgRating ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold">
        Welcome back, {user?.firstName || "User"}!
      </h1>
      <p className="mt-1 text-muted-foreground">
        Manage your listings, orders, and messages.
      </p>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/sell"
          className="rounded-xl border border-border p-6 transition-colors hover:border-primary/30"
        >
          <p className="text-sm text-muted-foreground">Active Listings</p>
          <p className="mt-1 text-3xl font-bold">
            {loading ? (
              <span className="inline-block h-9 w-8 animate-pulse rounded bg-muted" />
            ) : (
              stats.activeListings
            )}
          </p>
        </Link>
        <Link
          href="/orders"
          className="rounded-xl border border-border p-6 transition-colors hover:border-primary/30"
        >
          <p className="text-sm text-muted-foreground">Pending Orders</p>
          <p className="mt-1 text-3xl font-bold">
            {loading ? (
              <span className="inline-block h-9 w-8 animate-pulse rounded bg-muted" />
            ) : (
              stats.pendingOrders
            )}
          </p>
        </Link>
        <Link
          href="/notifications"
          className="rounded-xl border border-border p-6 transition-colors hover:border-primary/30"
        >
          <p className="text-sm text-muted-foreground">Unread Notifications</p>
          <p className="mt-1 text-3xl font-bold">
            {loading ? (
              <span className="inline-block h-9 w-8 animate-pulse rounded bg-muted" />
            ) : (
              stats.unreadNotifications
            )}
          </p>
        </Link>
        <Link
          href="/favorites"
          className="rounded-xl border border-border p-6 transition-colors hover:border-primary/30"
        >
          <p className="text-sm text-muted-foreground">Favorites</p>
          <p className="mt-1 text-3xl font-bold">
            {loading ? (
              <span className="inline-block h-9 w-8 animate-pulse rounded bg-muted" />
            ) : (
              stats.favorites
            )}
          </p>
        </Link>
      </div>

      {/* Seller Stats (only shown for sellers) */}
      {stats.totalSales !== null && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="mt-1 text-3xl font-bold">
              {loading ? (
                <span className="inline-block h-9 w-8 animate-pulse rounded bg-muted" />
              ) : (
                stats.totalSales
              )}
            </p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <p className="mt-1 text-3xl font-bold">
              {loading ? (
                <span className="inline-block h-9 w-8 animate-pulse rounded bg-muted" />
              ) : stats.avgRating && Number(stats.avgRating) > 0 ? (
                `${Number(stats.avgRating).toFixed(1)} / 5`
              ) : (
                "No ratings yet"
              )}
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/sell/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Create New Listing
          </Link>
          <Link
            href="/listings"
            className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Browse Marketplace
          </Link>
          <Link
            href="/settings"
            className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
