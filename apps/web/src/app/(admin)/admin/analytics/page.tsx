"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import {
  DollarSign,
  ShoppingCart,
  UserPlus,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Minus,
} from "lucide-react";

/* ---------- Types ---------- */

type TimeRange = "day" | "week" | "month" | "year";

interface AnalyticsData {
  timeRange: TimeRange;
  revenue: { total: number; previousPeriod: number; percentChange: number };
  orders: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    avgOrderValue: number;
  };
  users: {
    newUsers: number;
    totalUsers: number;
    sellersRegistered: number;
    previousPeriod: number;
    percentChange: number;
  };
  listings: {
    newListings: number;
    totalActive: number;
    totalViews: number;
    totalFavorites: number;
  };
  topBreeds: Array<{
    breed: string;
    count: number;
    percentageOfTotal: number;
  }>;
  topProvinces: Array<{
    province: string;
    listings: number;
    orders: number;
  }>;
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
}

/* ---------- Helpers ---------- */

function formatPeso(value: number): string {
  return (
    "\u20B1" +
    value.toLocaleString("en-PH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

function formatPesoDetailed(value: number): string {
  return (
    "\u20B1" +
    value.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-PH");
}

const RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

/* ---------- Small UI pieces ---------- */

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className ?? "h-4 w-20"}`}
    />
  );
}

function TrendBadge({ percent }: { percent: number }) {
  if (percent === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }
  const positive = percent > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const classes = positive
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    : "bg-red-50 text-red-700 ring-red-600/20";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      <Icon className="h-3 w-3" />
      {positive ? "+" : ""}
      {percent.toFixed(1)}%
    </span>
  );
}

/* ---------- Charts ---------- */

function RevenueChart({
  data,
}: {
  data: Array<{ date: string; revenue: number; orders: number }>;
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const width = 400;
  const height = 200;
  const bottomPad = 18;
  const plotHeight = height - bottomPad;

  // Grid lines (quarters).
  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => ({
    y: plotHeight - plotHeight * f,
    label: formatPeso(max * f),
  }));

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: "16rem" }}
      >
        {/* Grid */}
        {gridLines.map((g, i) => (
          <line
            key={i}
            x1={0}
            x2={width}
            y1={g.y}
            y2={g.y}
            stroke="#f3f4f6"
            strokeWidth={1}
          />
        ))}

        {/* Bars */}
        {data.map((point, i) => {
          const barW = width / Math.max(data.length, 1);
          const h = (point.revenue / max) * (plotHeight - 4);
          const x = i * barW + 2;
          const y = plotHeight - h;
          return (
            <g key={point.date + i}>
              <rect
                x={x}
                y={y}
                width={Math.max(barW - 4, 1)}
                height={Math.max(h, 0)}
                rx={2}
                fill="#dc2626"
                className="transition-colors hover:fill-red-700"
              >
                <title>
                  {point.date}: {formatPesoDetailed(point.revenue)} (
                  {point.orders} orders)
                </title>
              </rect>
            </g>
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={0}
          x2={width}
          y1={plotHeight}
          y2={plotHeight}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      </svg>

      {/* Axis helper row */}
      {data.length > 0 && (
        <div className="flex justify-between text-[11px] text-gray-400">
          <span>{data[0].date}</span>
          {data.length > 2 && (
            <span>{data[Math.floor(data.length / 2)].date}</span>
          )}
          <span>{data[data.length - 1].date}</span>
        </div>
      )}
    </div>
  );
}

function OrderStatusBar({
  completed,
  cancelled,
  pending,
}: {
  completed: number;
  cancelled: number;
  pending: number;
}) {
  const total = completed + cancelled + pending;
  if (total === 0) {
    return (
      <div className="flex h-8 w-full items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
        No orders in this period
      </div>
    );
  }
  const cPct = (completed / total) * 100;
  const cancPct = (cancelled / total) * 100;
  const pPct = (pending / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex h-8 w-full overflow-hidden rounded-lg">
        {completed > 0 && (
          <div
            className="flex items-center justify-center bg-emerald-500 text-[11px] font-medium text-white"
            style={{ width: `${cPct}%` }}
            title={`Completed: ${completed}`}
          >
            {cPct > 8 ? formatNumber(completed) : ""}
          </div>
        )}
        {pending > 0 && (
          <div
            className="flex items-center justify-center bg-amber-400 text-[11px] font-medium text-white"
            style={{ width: `${pPct}%` }}
            title={`Pending: ${pending}`}
          >
            {pPct > 8 ? formatNumber(pending) : ""}
          </div>
        )}
        {cancelled > 0 && (
          <div
            className="flex items-center justify-center bg-red-500 text-[11px] font-medium text-white"
            style={{ width: `${cancPct}%` }}
            title={`Cancelled: ${cancelled}`}
          >
            {cancPct > 8 ? formatNumber(cancelled) : ""}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          Completed ({formatNumber(completed)})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
          Pending ({formatNumber(pending)})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
          Cancelled ({formatNumber(cancelled)})
        </span>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [range, setRange] = useState<TimeRange>("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const resp = await apiGet<AnalyticsData>(
          `/admin/analytics?range=${range}`,
          accessToken!,
        );
        if (!cancelled) setData(resp);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load analytics",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, range]);

  const maxBreed = useMemo(() => {
    if (!data?.topBreeds?.length) return 1;
    return Math.max(...data.topBreeds.map((b) => b.count), 1);
  }, [data]);

  const conversionRate = useMemo(() => {
    if (!data) return 0;
    const views = data.listings.totalViews;
    const orderCount = data.orders.total;
    if (views === 0) return 0;
    return Math.round((orderCount / views) * 10000) / 100;
  }, [data]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">
            Revenue, orders, users, and listing performance across the
            platform.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {RANGE_OPTIONS.map((opt) => {
            const active = opt.value === range;
            return (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Key Metrics (4 cards) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            {loading ? (
              <SkeletonBox className="h-5 w-14 rounded-full" />
            ) : (
              <TrendBadge percent={data?.revenue.percentChange ?? 0} />
            )}
          </div>
          <div className="mt-4">
            {loading ? (
              <SkeletonBox className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatPesoDetailed(data?.revenue.total ?? 0)}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">Revenue (platform fees)</p>
            {!loading && data && (
              <p className="mt-1 text-xs text-gray-400">
                vs {formatPeso(data.revenue.previousPeriod)} previous period
              </p>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
              <ArrowUpRight className="h-3 w-3" />
              Orders
            </span>
          </div>
          <div className="mt-4">
            {loading ? (
              <SkeletonBox className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data?.orders.total ?? 0)}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">Total orders</p>
            {!loading && data && (
              <p className="mt-1 text-xs text-gray-400">
                Avg order value{" "}
                {formatPesoDetailed(data.orders.avgOrderValue ?? 0)}
              </p>
            )}
          </div>
        </div>

        {/* New Users */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
            {loading ? (
              <SkeletonBox className="h-5 w-14 rounded-full" />
            ) : (
              <TrendBadge percent={data?.users.percentChange ?? 0} />
            )}
          </div>
          <div className="mt-4">
            {loading ? (
              <SkeletonBox className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data?.users.newUsers ?? 0)}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">New users</p>
            {!loading && data && (
              <p className="mt-1 text-xs text-gray-400">
                {formatNumber(data.users.sellersRegistered)} new sellers
              </p>
            )}
          </div>
        </div>

        {/* Active Listings */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Package className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
              <ArrowUpRight className="h-3 w-3" />
              Listings
            </span>
          </div>
          <div className="mt-4">
            {loading ? (
              <SkeletonBox className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data?.listings.totalActive ?? 0)}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">Active listings</p>
            {!loading && data && (
              <p className="mt-1 text-xs text-gray-400">
                +{formatNumber(data.listings.newListings)} new this period
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Revenue Chart ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Daily Revenue
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Platform fees from completed orders
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-600" />
            Revenue
          </span>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <SkeletonBox className="h-full w-full" />
            </div>
          ) : !data?.dailyRevenue?.length ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
              No revenue data for this period
            </div>
          ) : (
            <RevenueChart data={data.dailyRevenue} />
          )}
        </div>
      </div>

      {/* ── Two-column: Top Breeds + Top Provinces ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Breeds */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-900">
              Top Breeds
            </h3>
            <span className="text-xs text-gray-400">by listings</span>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <SkeletonBox className="h-4 w-24" />
                      <SkeletonBox className="h-4 w-16" />
                    </div>
                    <SkeletonBox className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : !data?.topBreeds?.length ? (
              <div className="py-12 text-center text-sm text-gray-400">
                No breed data available
              </div>
            ) : (
              <div className="space-y-4">
                {data.topBreeds.map((b) => {
                  const barWidth = (b.count / maxBreed) * 100;
                  return (
                    <div key={b.breed} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900">
                          {b.breed}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatNumber(b.count)} listings
                          <span className="ml-2 text-gray-400">
                            ({b.percentageOfTotal.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-red-600 transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Provinces */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-900">
              Top Provinces
            </h3>
            <span className="text-xs text-gray-400">by activity</span>
          </div>
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <SkeletonBox className="h-4 flex-1" />
                  <SkeletonBox className="h-4 w-12" />
                  <SkeletonBox className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : !data?.topProvinces?.length ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No province data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3">Province</th>
                    <th className="px-6 py-3 text-right">Listings</th>
                    <th className="px-6 py-3 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.topProvinces.map((p) => (
                    <tr
                      key={p.province}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-3 font-medium text-gray-900">
                        {p.province}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-right text-gray-700">
                        {formatNumber(p.listings)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-right text-gray-700">
                        {formatNumber(p.orders)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Order Stats Summary ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Order Status Breakdown
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Distribution of orders by status in the selected period
              </p>
            </div>
            {!loading && data && (
              <span className="text-sm font-medium text-gray-700">
                {formatNumber(data.orders.total)} total
              </span>
            )}
          </div>
          {loading ? (
            <SkeletonBox className="h-8 w-full rounded-lg" />
          ) : (
            <OrderStatusBar
              completed={data?.orders.completed ?? 0}
              cancelled={data?.orders.cancelled ?? 0}
              pending={data?.orders.pending ?? 0}
            />
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Conversion Rate
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Orders per listing view
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          {loading ? (
            <SkeletonBox className="h-8 w-20" />
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900">
                {conversionRate.toFixed(2)}%
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {formatNumber(data?.orders.total ?? 0)} orders /{" "}
                {formatNumber(data?.listings.totalViews ?? 0)} total views
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span>Favorites</span>
                <span className="font-medium text-gray-700">
                  {formatNumber(data?.listings.totalFavorites ?? 0)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
