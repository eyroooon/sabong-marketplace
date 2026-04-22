"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Clock,
  TrendingUp,
  UserPlus,
  DollarSign,
} from "lucide-react";
import { LiveActivityTicker } from "@/components/admin/LiveActivityTicker";

/* ---------- Types ---------- */

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  activeListings: number;
  totalOrders: number;
  pendingReports: number;
}

interface RecentOrder {
  id: string;
  buyerName?: string;
  buyer?: { firstName?: string; lastName?: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

/* ---------- Helpers ---------- */

function formatCurrency(value: number): string {
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

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed" || s === "delivered")
    return "bg-green-50 text-green-700 ring-green-600/20";
  if (s === "pending" || s === "processing")
    return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
  if (s === "cancelled" || s === "refunded")
    return "bg-red-50 text-red-700 ring-red-600/20";
  if (s === "shipped" || s === "in_transit")
    return "bg-blue-50 text-blue-700 ring-blue-600/20";
  return "bg-gray-50 text-gray-700 ring-gray-600/20";
}

/* ---------- Stat card config ---------- */

const statCards = [
  {
    key: "totalUsers" as const,
    label: "Total Users",
    icon: Users,
    color: "bg-blue-100 text-blue-600",
    href: "/admin/users",
  },
  {
    key: "totalSellers" as const,
    label: "Active Sellers",
    icon: Store,
    color: "bg-green-100 text-green-600",
    href: "/admin/sellers",
  },
  {
    key: "activeListings" as const,
    label: "Active Listings",
    icon: Package,
    color: "bg-purple-100 text-purple-600",
    href: "/admin/listings",
  },
  {
    key: "totalOrders" as const,
    label: "Total Orders",
    icon: ShoppingCart,
    color: "bg-orange-100 text-orange-600",
    href: "/admin/orders",
  },
  {
    key: "pendingReports" as const,
    label: "Open Reports",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-600",
    href: "/admin/reports",
  },
];

/* ---------- Skeleton helpers ---------- */

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className ?? "h-4 w-20"}`}
    />
  );
}

/* ---------- Component ---------- */

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    async function load() {
      try {
        const [statsData, ordersData] = await Promise.all([
          apiGet<DashboardStats>("/admin/stats", accessToken!),
          apiGet<{ data: RecentOrder[] } | RecentOrder[]>(
            "/admin/orders?limit=5",
            accessToken!,
          ).catch(() => [] as RecentOrder[]),
        ]);

        setStats(statsData);

        // Handle both wrapped { data: [] } and raw array response
        if (Array.isArray(ordersData)) {
          setRecentOrders(ordersData);
        } else if (ordersData && "data" in ordersData) {
          setRecentOrders(ordersData.data);
        }

        // Try loading activity feed (may not exist yet)
        try {
          const actData = await apiGet<
            { data: ActivityEvent[] } | ActivityEvent[]
          >("/admin/activity?limit=5", accessToken!);
          if (Array.isArray(actData)) {
            setActivity(actData);
          } else if (actData && "data" in actData) {
            setActivity(actData.data);
          }
        } catch {
          // Activity endpoint may not exist — use empty
        }
      } catch {
        // Stats fetch failed
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [accessToken]);

  /* Derived quick stats */
  const revenueThisMonth =
    recentOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0) || 0;
  const avgOrderValue =
    recentOrders.length > 0 ? revenueThisMonth / recentOrders.length : 0;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back. Here is what is happening on BloodlinePH today.
        </p>
      </div>

      {/* ── Live activity ticker ── */}
      <LiveActivityTicker />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          return (
            <div
              key={card.key}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <SkeletonBox className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(value)}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">{card.label}</p>
              </div>
              <Link
                href={card.href}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* ── Middle: Recent Orders + Activity ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders — takes 2 cols */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-900">
              Recent Orders
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <SkeletonBox className="h-4 w-24" />
                  <SkeletonBox className="h-4 w-32" />
                  <SkeletonBox className="h-5 w-16 rounded-full" />
                  <SkeletonBox className="h-4 w-20" />
                  <SkeletonBox className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ShoppingCart className="mb-2 h-8 w-8" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3">Order ID</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => {
                    const customerName =
                      order.buyerName ??
                      (order.buyer
                        ? `${order.buyer.firstName ?? ""} ${order.buyer.lastName ?? ""}`.trim()
                        : "Unknown");
                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-3 font-medium text-gray-900">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-gray-600">
                          {customerName}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(order.totalAmount ?? 0)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-right text-gray-500">
                          {timeAgo(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-900">
              Recent Activity
            </h3>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBox className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBox className="h-3 w-full" />
                    <SkeletonBox className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Clock className="mb-2 h-8 w-8" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activity.map((evt) => (
                <div key={evt.id} className="flex gap-3 px-6 py-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">{evt.message}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {timeAgo(evt.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom: Quick Stats ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Revenue (recent)
            </p>
            {loading ? (
              <SkeletonBox className="mt-1 h-7 w-24" />
            ) : (
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(revenueThisMonth)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Avg Order Value
            </p>
            {loading ? (
              <SkeletonBox className="mt-1 h-7 w-24" />
            ) : (
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(avgOrderValue)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Users
            </p>
            {loading ? (
              <SkeletonBox className="mt-1 h-7 w-24" />
            ) : (
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(stats?.totalUsers ?? 0)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
