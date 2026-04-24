"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  itemPrice: string;
  shippingFee: string;
  platformFee: string;
  totalAmount: string;
  status: string;
  deliveryMethod: string | null;
  deliveryAddress: string | null;
  trackingNumber: string | null;
  shippingProvider: string | null;
  escrowStatus: string;
  buyerNotes: string | null;
  sellerNotes: string | null;
  cancelReason: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending:         { bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400" },
  payment_pending: { bg: "bg-orange-50",  text: "text-orange-700", dot: "bg-orange-400" },
  paid:            { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-400" },
  confirmed:       { bg: "bg-indigo-50",  text: "text-indigo-700", dot: "bg-indigo-400" },
  shipped:         { bg: "bg-purple-50",  text: "text-purple-700", dot: "bg-purple-400" },
  delivered:       { bg: "bg-teal-50",    text: "text-teal-700",   dot: "bg-teal-400" },
  completed:       { bg: "bg-emerald-50", text: "text-emerald-700",dot: "bg-emerald-400" },
  cancelled:       { bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-400" },
};

const DELIVERY_ICONS: Record<string, string> = {
  shipping: "🚚",
  pickup: "📦",
  meetup: "🤝",
};

const PAGE_SIZE = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: string | number): string {
  return `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { accessToken } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(
    (page = 1) => {
      if (!accessToken) return;
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter) params.set("status", statusFilter);

      apiGet<OrdersResponse>(`/admin/orders?${params}`, accessToken)
        .then((res) => {
          setOrders(res.data);
          setPagination(res.pagination);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [accessToken, statusFilter],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Computed stats (from loaded page) ──────────────────────────────────────

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const ordersToday = orders.filter(
      (o) => new Date(o.createdAt) >= todayStart,
    ).length;

    return { totalRevenue, avgOrderValue, ordersToday };
  }, [orders]);

  // ── Pagination helpers ─────────────────────────────────────────────────────

  const pageStart = (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600">
            {pagination.total.toLocaleString()}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and track all marketplace orders
        </p>
      </div>

      {/* ── Status Tabs ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                active
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Page Revenue
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Avg Order Value
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {formatCurrency(stats.avgOrderValue)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Orders Today
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {stats.ordersToday}
          </p>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Delivery
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
                      <p className="text-sm text-muted-foreground">
                        Loading orders...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <svg
                          className="h-6 w-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                          />
                        </svg>
                      </div>
                      <p className="font-medium text-gray-900">
                        No orders found
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {statusFilter
                          ? `No ${statusFilter} orders to display`
                          : "Orders will appear here once customers start purchasing"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const style = STATUS_STYLES[order.status] || {
                    bg: "bg-gray-50",
                    text: "text-gray-700",
                    dot: "bg-gray-400",
                  };
                  const isExpanded = expandedId === order.id;

                  return (
                    <Fragment key={order.id}>
                      <tr
                        className="group cursor-pointer transition-colors hover:bg-gray-50/70"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : order.id)
                        }
                      >
                        {/* Order Number */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-semibold text-gray-900">
                            {order.orderNumber}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </td>

                        {/* Delivery */}
                        <td className="px-4 py-3.5">
                          {order.deliveryMethod ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">
                                {DELIVERY_ICONS[order.deliveryMethod] || "📋"}
                              </span>
                              <span className="capitalize text-gray-600">
                                {order.deliveryMethod}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                            />
                            {statusLabel(order.status)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-gray-500">
                          <span title={new Date(order.createdAt).toLocaleString()}>
                            {relativeTime(order.createdAt)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(isExpanded ? null : order.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
                          >
                            {isExpanded ? "Hide" : "Details"}
                            <svg
                              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* ── Expanded Details ───────────────────────────────── */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50/50 px-4 py-0">
                            <div className="py-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {/* Pricing Breakdown */}
                                <div className="rounded-lg border border-gray-100 bg-white p-3">
                                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Pricing
                                  </h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">
                                        Item price
                                      </span>
                                      <span className="text-gray-900">
                                        {formatCurrency(order.itemPrice)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">
                                        Logistics (platform keeps)
                                      </span>
                                      <span className="text-gray-900">
                                        {formatCurrency(order.shippingFee)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-100 pt-1.5 font-semibold">
                                      <span className="text-gray-700">
                                        Buyer paid
                                      </span>
                                      <span className="text-gray-900">
                                        {formatCurrency(order.totalAmount)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                      <span>
                                        Platform fee (seller pays)
                                      </span>
                                      <span>
                                        {formatCurrency(order.platformFee)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700">
                                      <span>Seller payout</span>
                                      <span>
                                        {formatCurrency(
                                          String(
                                            Number(order.itemPrice) -
                                              Number(order.platformFee || 0),
                                          ),
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-indigo-700">
                                      <span>Platform revenue</span>
                                      <span>
                                        {formatCurrency(
                                          String(
                                            Number(order.platformFee || 0) +
                                              Number(order.shippingFee || 0),
                                          ),
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Shipping Info */}
                                <div className="rounded-lg border border-gray-100 bg-white p-3">
                                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Shipping
                                  </h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">
                                        Method
                                      </span>
                                      <span className="capitalize text-gray-900">
                                        {order.deliveryMethod || "--"}
                                      </span>
                                    </div>
                                    {order.shippingProvider && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          Provider
                                        </span>
                                        <span className="text-gray-900">
                                          {order.shippingProvider}
                                        </span>
                                      </div>
                                    )}
                                    {order.trackingNumber && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">
                                          Tracking
                                        </span>
                                        <span className="font-mono text-xs text-gray-900">
                                          {order.trackingNumber}
                                        </span>
                                      </div>
                                    )}
                                    {order.deliveryAddress && (
                                      <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600">
                                        {order.deliveryAddress}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Timeline */}
                                <div className="rounded-lg border border-gray-100 bg-white p-3">
                                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Timeline
                                  </h4>
                                  <div className="space-y-1.5 text-sm">
                                    <TimelineRow
                                      label="Created"
                                      date={order.createdAt}
                                    />
                                    <TimelineRow
                                      label="Paid"
                                      date={order.paidAt}
                                    />
                                    <TimelineRow
                                      label="Confirmed"
                                      date={order.confirmedAt}
                                    />
                                    <TimelineRow
                                      label="Shipped"
                                      date={order.shippedAt}
                                    />
                                    <TimelineRow
                                      label="Delivered"
                                      date={order.deliveredAt}
                                    />
                                    <TimelineRow
                                      label="Completed"
                                      date={order.completedAt}
                                    />
                                    {order.cancelledAt && (
                                      <TimelineRow
                                        label="Cancelled"
                                        date={order.cancelledAt}
                                        isError
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Notes & Escrow */}
                                <div className="rounded-lg border border-gray-100 bg-white p-3">
                                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Additional Info
                                  </h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">
                                        Escrow
                                      </span>
                                      <span className="capitalize text-gray-900">
                                        {order.escrowStatus}
                                      </span>
                                    </div>
                                    {order.buyerNotes && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-500">
                                          Buyer notes
                                        </p>
                                        <p className="mt-0.5 rounded bg-gray-50 p-2 text-xs text-gray-600">
                                          {order.buyerNotes}
                                        </p>
                                      </div>
                                    )}
                                    {order.sellerNotes && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-500">
                                          Seller notes
                                        </p>
                                        <p className="mt-0.5 rounded bg-gray-50 p-2 text-xs text-gray-600">
                                          {order.sellerNotes}
                                        </p>
                                      </div>
                                    )}
                                    {order.cancelReason && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-red-500">
                                          Cancel reason
                                        </p>
                                        <p className="mt-0.5 rounded bg-red-50 p-2 text-xs text-red-700">
                                          {order.cancelReason}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* IDs row */}
                              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                                <span>
                                  Order ID:{" "}
                                  <span className="font-mono">{order.id.slice(0, 8)}</span>
                                </span>
                                <span>
                                  Buyer:{" "}
                                  <span className="font-mono">{order.buyerId.slice(0, 8)}</span>
                                </span>
                                <span>
                                  Seller:{" "}
                                  <span className="font-mono">{order.sellerId.slice(0, 8)}</span>
                                </span>
                                <span>
                                  Listing:{" "}
                                  <span className="font-mono">{order.listingId.slice(0, 8)}</span>
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ──────────────────────────────────────────── */}
        {!loading && orders.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-3">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">{pageStart}</span>
              {" - "}
              <span className="font-medium text-gray-700">{pageEnd}</span>
              {" of "}
              <span className="font-medium text-gray-700">
                {pagination.total.toLocaleString()}
              </span>{" "}
              orders
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchOrders(pagination.page - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchOrders(pagination.page + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

import { Fragment } from "react";

function TimelineRow({
  label,
  date,
  isError = false,
}: {
  label: string;
  date: string | null;
  isError?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={isError ? "text-red-500" : "text-gray-500"}>
        {label}
      </span>
      {date ? (
        <span
          className={`text-xs ${isError ? "text-red-600" : "text-gray-900"}`}
          title={new Date(date).toLocaleString()}
        >
          {relativeTime(date)}
        </span>
      ) : (
        <span className="text-xs text-gray-300">--</span>
      )}
    </div>
  );
}
