"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ListingCard } from "@/components/listings/listing-card";
import { apiGet } from "@/lib/api";
import { CATEGORIES, BREEDS } from "@sabong/shared";

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border">
                <div className="aspect-square bg-muted" />
                <div className="space-y-2 p-3">
                  <div className="h-5 w-20 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    breed: searchParams.get("breed") || "",
    province: searchParams.get("province") || "",
    sort: "newest",
  });

  useEffect(() => {
    fetchListings();
  }, [filters]);

  async function fetchListings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      if (filters.breed) params.set("breed", filters.breed);
      if (filters.province) params.set("province", filters.province);
      params.set("sort", filters.sort);

      const res = await apiGet(`/listings?${params.toString()}`);
      setListings(res.data || []);
      setPagination(res.pagination);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">
          {filters.category
            ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}s`
            : "All Listings"}
        </h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value }))
            }
            className="rounded-lg border border-input px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filters.breed}
            onChange={(e) =>
              setFilters((f) => ({ ...f, breed: e.target.value }))
            }
            className="rounded-lg border border-input px-3 py-2 text-sm"
          >
            <option value="">All Breeds</option>
            {BREEDS.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sort: e.target.value }))
            }
            className="rounded-lg border border-input px-3 py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border">
              <div className="aspect-square bg-muted" />
              <div className="space-y-2 p-3">
                <div className="h-5 w-20 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">No listings found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filters or check back later.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                className={`rounded-lg px-3 py-2 text-sm ${
                  page === pagination.page
                    ? "bg-primary text-white"
                    : "border border-input hover:bg-muted"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
