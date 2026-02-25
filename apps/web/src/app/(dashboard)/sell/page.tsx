"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPHP } from "@sabong/shared";

export default function MyListingsPage() {
  const { accessToken } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      apiGet("/listings/my", accessToken)
        .then((res) => setListings(res.data || []))
        .catch(() => setListings([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [accessToken]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <Link
          href="/sell/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          New Listing
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="mt-6 space-y-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 rounded-xl border border-border p-4"
            >
              <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-muted" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{listing.title}</h3>
                <p className="text-sm text-primary font-semibold">
                  {formatPHP(Number(listing.price))}
                </p>
                <div className="mt-1 flex gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      listing.status === "active"
                        ? "bg-green-100 text-green-700"
                        : listing.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {listing.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {listing.viewCount} views
                  </span>
                </div>
              </div>
              <Link
                href={`/sell/${listing.id}/edit`}
                className="rounded-lg border border-input px-3 py-1.5 text-xs hover:bg-muted"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground">
            You don&apos;t have any listings yet.
          </p>
          <Link
            href="/sell/new"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Create Your First Listing
          </Link>
        </div>
      )}
    </div>
  );
}
