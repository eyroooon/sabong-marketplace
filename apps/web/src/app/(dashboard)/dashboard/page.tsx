"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

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
        <div className="rounded-xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Active Listings</p>
          <p className="mt-1 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Pending Orders</p>
          <p className="mt-1 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Unread Messages</p>
          <p className="mt-1 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Favorites</p>
          <p className="mt-1 text-3xl font-bold">0</p>
        </div>
      </div>

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
