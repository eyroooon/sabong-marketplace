"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  payment_pending: { label: "Awaiting Payment", color: "bg-orange-100 text-orange-800" },
  paid: { label: "Paid", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmed", color: "bg-indigo-100 text-indigo-800" },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Delivered", color: "bg-teal-100 text-teal-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800" },
};

export default function OrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"buying" | "selling">("buying");

  useEffect(() => {
    fetchOrders();
  }, [tab]);

  async function fetchOrders() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiGet(`/orders?role=${tab === "buying" ? "buyer" : "seller"}`, accessToken);
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab("buying")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "buying" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Purchases
        </button>
        <button
          onClick={() => setTab("selling")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "selling" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sales
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border p-4">
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 rounded bg-muted" />
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_LABELS[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{order.listingTitle || "Order"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <p className="mt-2 text-lg font-bold">
                      {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(order.totalAmount / 100)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">
            {tab === "buying" ? "No purchases yet" : "No sales yet"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "buying"
              ? "Browse listings to find your next gamefowl."
              : "List your gamefowl to start selling."}
          </p>
          <Link
            href={tab === "buying" ? "/listings" : "/sell/new"}
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            {tab === "buying" ? "Browse Listings" : "Create Listing"}
          </Link>
        </div>
      )}
    </div>
  );
}
