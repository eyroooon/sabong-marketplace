"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiDelete } from "@/lib/api";
import { ListingCard } from "@/components/listings/listing-card";
import Link from "next/link";

export default function FavoritesPage() {
  const { accessToken } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  async function fetchFavorites() {
    if (!accessToken) return;
    try {
      const res = await apiGet("/favorites", accessToken);
      setFavorites(res.data || []);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(listingId: string) {
    if (!accessToken) return;
    try {
      await apiDelete(`/favorites/${listingId}`, accessToken);
      setFavorites((prev) => prev.filter((f) => f.listingId !== listingId));
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Favorites</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border">
              <div className="aspect-square bg-muted" />
              <div className="space-y-2 p-3">
                <div className="h-5 w-20 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {favorites.map((fav) => (
            <div key={fav.id} className="relative">
              <ListingCard listing={fav.listing || fav} />
              <button
                onClick={() => removeFavorite(fav.listingId)}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm transition-colors hover:bg-red-50"
                title="Remove from favorites"
              >
                <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <svg className="mx-auto h-16 w-16 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="mt-4 text-lg text-muted-foreground">No favorites yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Save listings you like to view them later.
          </p>
          <Link
            href="/listings"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Browse Listings
          </Link>
        </div>
      )}
    </div>
  );
}
