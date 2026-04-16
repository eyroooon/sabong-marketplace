"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";

interface Listing {
  id: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  status: string;
  sellerId: string;
  sellerName?: string;
  images?: string[];
  views?: number;
  createdAt: string;
}

interface ListingsResponse {
  data: Listing[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

type SortField = "price" | "createdAt" | "views";
type SortDir = "asc" | "desc";

const STATUS_STYLES: Record<string, { bg: string; dot: string }> = {
  active: { bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  draft: { bg: "bg-yellow-50 text-yellow-700 ring-yellow-600/20", dot: "bg-yellow-500" },
  archived: { bg: "bg-gray-100 text-gray-600 ring-gray-500/20", dot: "bg-gray-400" },
  sold: { bg: "bg-blue-50 text-blue-700 ring-blue-600/20", dot: "bg-blue-500" },
  reserved: { bg: "bg-orange-50 text-orange-700 ring-orange-600/20", dot: "bg-orange-500" },
};

const CATEGORY_STYLES: Record<string, string> = {
  stag: "bg-amber-50 text-amber-700 ring-amber-600/20",
  broodcock: "bg-purple-50 text-purple-700 ring-purple-600/20",
  pullet: "bg-pink-50 text-pink-700 ring-pink-600/20",
  hen: "bg-rose-50 text-rose-700 ring-rose-600/20",
  eggs: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  feeds: "bg-lime-50 text-lime-700 ring-lime-600/20",
  supplements: "bg-teal-50 text-teal-700 ring-teal-600/20",
  accessories: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(price: string | number) {
  return `₱${Number(price).toLocaleString("en-PH")}`;
}

export default function AdminListingsPage() {
  const { accessToken } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchListings = useCallback(
    (page = 1) => {
      if (!accessToken) return;
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);

      apiGet<ListingsResponse>(`/admin/listings?${params}`, accessToken)
        .then((res) => {
          setListings(res.data);
          setPagination(res.pagination);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [accessToken, statusFilter],
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const changeStatus = async (listingId: string, newStatus: string) => {
    if (!accessToken) return;
    try {
      await apiPatch(`/admin/listings/${listingId}/status`, { status: newStatus }, accessToken);
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l)),
      );
    } catch {
      // ignore
    }
    setOpenMenu(null);
  };

  const deleteListing = async (listingId: string) => {
    if (!accessToken) return;
    try {
      await apiDelete(`/admin/listings/${listingId}`, accessToken);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch {
      // ignore
    }
    setOpenMenu(null);
  };

  // Client-side filter + sort
  const filtered = useMemo(() => {
    let list = [...listings];

    if (categoryFilter) {
      list = list.filter((l) => l.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.slug.toLowerCase().includes(q) ||
          (l.sellerName && l.sellerName.toLowerCase().includes(q)),
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "price") {
        cmp = Number(a.price) - Number(b.price);
      } else if (sortField === "views") {
        cmp = (a.views ?? 0) - (b.views ?? 0);
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [listings, categoryFilter, search, sortField, sortDir]);

  const categories = useMemo(
    () => Array.from(new Set(listings.map((l) => l.category))).sort(),
    [listings],
  );

  const pageStart = (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination.total} total listing{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, slug, or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sort by</label>
          <select
            value={`${sortField}-${sortDir}`}
            onChange={(e) => {
              const [f, d] = e.target.value.split("-") as [SortField, SortDir];
              setSortField(f);
              setSortDir(d);
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="createdAt-desc">Newest first</option>
            <option value="createdAt-asc">Oldest first</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="views-desc">Most viewed</option>
            <option value="views-asc">Least viewed</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Listing
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Seller
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Views
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm text-muted-foreground">Loading listings...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                      <p className="text-sm font-medium text-muted-foreground">No listings found</p>
                      <p className="text-xs text-muted-foreground/60">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((listing, idx) => {
                  const statusStyle = STATUS_STYLES[listing.status] ?? STATUS_STYLES.archived;
                  const catStyle = CATEGORY_STYLES[listing.category] ?? "bg-gray-50 text-gray-700 ring-gray-600/20";
                  const thumbUrl = listing.images?.[0];

                  return (
                    <tr
                      key={listing.id}
                      className={`transition-colors hover:bg-muted/50 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={listing.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <svg className="h-5 w-5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003.75 21z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[200px] truncate font-medium text-foreground">
                              {listing.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">/{listing.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {listing.sellerName || (
                          <span className="font-mono text-xs text-muted-foreground/50">
                            {listing.sellerId.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${catStyle}`}
                        >
                          {listing.category}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">
                        {formatPrice(listing.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyle.bg}`}
                        >
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {listing.views?.toLocaleString() ?? "--"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDate(listing.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block" ref={openMenu === listing.id ? menuRef : undefined}>
                          <button
                            onClick={() => setOpenMenu(openMenu === listing.id ? null : listing.id)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {openMenu === listing.id && (
                            <div className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-lg border border-border bg-popover py-1 shadow-lg ring-1 ring-black/5">
                              <a
                                href={`/listings/${listing.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                              >
                                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                                View Listing
                              </a>
                              <div className="my-1 border-t border-border" />
                              {listing.status !== "active" && (
                                <button
                                  onClick={() => changeStatus(listing.id, "active")}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                                >
                                  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Activate
                                </button>
                              )}
                              {listing.status !== "archived" && (
                                <button
                                  onClick={() => changeStatus(listing.id, "archived")}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                                >
                                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                  </svg>
                                  Archive
                                </button>
                              )}
                              <button
                                onClick={() => changeStatus(listing.id, "draft")}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                              >
                                <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                                Feature
                              </button>
                              <div className="my-1 border-t border-border" />
                              <button
                                onClick={() => deleteListing(listing.id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading listings...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No listings found</div>
        ) : (
          filtered.map((listing) => {
            const statusStyle = STATUS_STYLES[listing.status] ?? STATUS_STYLES.archived;
            const catStyle = CATEGORY_STYLES[listing.category] ?? "bg-gray-50 text-gray-700 ring-gray-600/20";
            const thumbUrl = listing.images?.[0];

            return (
              <div
                key={listing.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex gap-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg className="h-6 w-6 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{listing.title}</p>
                    <p className="truncate text-xs text-muted-foreground">/{listing.slug}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyle.bg}`}>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                        {listing.status}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${catStyle}`}>
                        {listing.category}
                      </span>
                    </div>
                  </div>
                  <p className="whitespace-nowrap text-sm font-semibold tabular-nums">
                    {formatPrice(listing.price)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatDate(listing.createdAt)}</span>
                    {listing.views != null && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.views.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {listing.status !== "active" && (
                      <button
                        onClick={() => changeStatus(listing.id, "active")}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
                      >
                        Activate
                      </button>
                    )}
                    {listing.status !== "archived" && (
                      <button
                        onClick={() => changeStatus(listing.id, "archived")}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{pagination.total > 0 ? pageStart : 0}</span> to{" "}
          <span className="font-medium text-foreground">{pageEnd}</span> of{" "}
          <span className="font-medium text-foreground">{pagination.total}</span> listings
        </p>
        <div className="flex items-center gap-1">
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchListings(pagination.page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchListings(p)}
              className={`hidden h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors sm:inline-flex ${
                p === pagination.page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchListings(pagination.page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            Next
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
