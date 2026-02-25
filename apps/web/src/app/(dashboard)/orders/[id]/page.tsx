"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPatch } from "@/lib/api";
import Link from "next/link";

const STATUS_STEPS = [
  { key: "pending", label: "Placed" },
  { key: "paid", label: "Paid" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  async function fetchOrder() {
    if (!accessToken) return;
    try {
      const res = await apiGet(`/orders/${id}`, accessToken);
      setOrder(res);
    } catch {
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string) {
    if (!accessToken) return;
    setActionLoading(true);
    try {
      await apiPatch(`/orders/${id}/${action}`, {}, accessToken);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!order) return null;

  const isBuyer = order.buyerId === user?.id;
  const isSeller = order.sellerId === user?.id;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  return (
    <div>
      <Link href="/orders" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        &larr; Back to Orders
      </Link>

      <h1 className="mb-2 text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Placed on{" "}
        {new Date(order.createdAt).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      {/* Status Progress */}
      {!isCancelled && (
        <div className="mb-8 rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Order Status</h2>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      i <= currentStepIndex
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i <= currentStepIndex ? "\u2713" : i + 1}
                  </div>
                  <span className="mt-1 text-xs">{step.label}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      i < currentStepIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            This order has been {order.status}.
          </p>
          {order.cancelReason && (
            <p className="mt-1 text-sm text-red-600">Reason: {order.cancelReason}</p>
          )}
        </div>
      )}

      {/* Order Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>
                {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(order.subtotalAmount / 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee (5%)</span>
              <span>
                {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(order.platformFee / 100)}
              </span>
            </div>
            {order.shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(order.shippingFee / 100)}
                </span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>
                  {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(order.totalAmount / 100)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Delivery Details</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Method: </span>
              {order.deliveryMethod === "meetup" ? "Meet-up" : "Shipping"}
            </p>
            {order.shippingAddress && (
              <p>
                <span className="text-muted-foreground">Address: </span>
                {order.shippingAddress}
              </p>
            )}
            {order.meetupLocation && (
              <p>
                <span className="text-muted-foreground">Meet-up Location: </span>
                {order.meetupLocation}
              </p>
            )}
            {order.trackingNumber && (
              <p>
                <span className="text-muted-foreground">Tracking #: </span>
                {order.trackingNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        {isSeller && order.status === "paid" && (
          <button
            onClick={() => handleAction("confirm")}
            disabled={actionLoading}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Confirm Order
          </button>
        )}
        {isSeller && order.status === "confirmed" && (
          <button
            onClick={() => handleAction("ship")}
            disabled={actionLoading}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Mark as Shipped
          </button>
        )}
        {isBuyer && order.status === "shipped" && (
          <button
            onClick={() => handleAction("deliver")}
            disabled={actionLoading}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Confirm Delivery
          </button>
        )}
        {isBuyer && order.status === "delivered" && (
          <button
            onClick={() => handleAction("complete")}
            disabled={actionLoading}
            className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Complete & Release Payment
          </button>
        )}
        {(order.status === "pending" || order.status === "payment_pending") && (
          <button
            onClick={() => handleAction("cancel")}
            disabled={actionLoading}
            className="rounded-lg border border-red-300 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}
