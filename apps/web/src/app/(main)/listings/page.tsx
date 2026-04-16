"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ListingCard } from "@/components/listings/listing-card";
import { apiGet } from "@/lib/api";
import { CATEGORIES, BREEDS } from "@sabong/shared";
import { Search, X } from "lucide-react";

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
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    breed: searchParams.get("breed") || "",
    search: searchParams.get("search") || "",
    province: searchParams.get("province") || "",
    sort: searchParams.get("sort") || "newest",
    page: Number(searchParams.get("page")) || 1,
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      if (filters.search) params.set("search", filters.search);
      if (filters.breed) params.set("breed", filters.breed);
      if (filters.province) params.set("province", filters.province);
      params.set("sort", filters.sort);
      params.set("page", String(filters.page));

      const res = await apiGet<any>(`/listings?${params.toString()}`);
      setListings(res.data || []);
      setPagination(res.pagination);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.breed) params.set("breed", filters.breed);
    if (filters.search) params.set("search", filters.search);
    if (filters.province) params.set("province", filters.province);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (filters.page > 1) params.set("page", String(filters.page));
    const qs = params.toString();
    router.replace(`/listings${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [filters, router]);

  function updateFilter(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 })); // Reset page on filter change
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.elements.namedItem("listingSearch") as HTMLInputElement;
          updateFilter("search", input.value.trim());
        }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="listingSearch"
            type="text"
            defaultValue={filters.search}
            key={filters.search}
            placeholder="Search by breed, title, or description..."
            className="w-full rounded-lg border border-input bg-white py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => updateFilter("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {filters.search
              ? `Showing results for: "${filters.search}"`
              : filters.category
                ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}s`
                : "All Listings"}
          </h1>
          {pagination && (
            <p className="mt-1 text-sm text-muted-foreground">
              {pagination.total} listing{pagination.total !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <button
              onClick={() => updateFilter("search", "")}
              className="flex items-center gap-1 rounded-lg border border-primary bg-primary/5 px-3 py-2 text-sm text-primary"
            >
              Clear search
            </button>
          )}

          <select
            value={filters.category}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-input px-3 py-2 text-sm"
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
            onChange={(e) => updateFilter("breed", e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-input px-3 py-2 text-sm"
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
            className="w-full sm:w-auto rounded-lg border border-input px-3 py-2 text-sm"
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
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
            disabled={filters.page <= 1}
            className="rounded-lg border border-input px-4 py-3 sm:px-3 sm:py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter((page) => {
              // Show first, last, and pages around current
              return (
                page === 1 ||
                page === pagination.totalPages ||
                Math.abs(page - filters.page) <= 1
              );
            })
            .map((page, idx, arr) => (
              <span key={page} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== page - 1 && (
                  <span className="px-1 text-muted-foreground">...</span>
                )}
                <button
                  onClick={() => setFilters((f) => ({ ...f, page }))}
                  className={`rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-sm ${
                    page === filters.page
                      ? "bg-primary text-white"
                      : "border border-input hover:bg-muted"
                  }`}
                >
                  {page}
                </button>
              </span>
            ))}

          <button
            onClick={() =>
              setFilters((f) => ({ ...f, page: Math.min(pagination.totalPages, f.page + 1) }))
            }
            disabled={filters.page >= pagination.totalPages}
            className="rounded-lg border border-input px-4 py-3 sm:px-3 sm:py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
