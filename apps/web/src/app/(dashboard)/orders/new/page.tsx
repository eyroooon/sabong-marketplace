"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPHP } from "@sabong/shared";

const PAYMENT_METHODS = [
  { value: "gcash", label: "GCash" },
  { value: "maya", label: "Maya" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "otc_cash", label: "Cash (OTC)" },
];

export default function CreateOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();
  const listingId = searchParams.get("listing");
  const listingSlug = searchParams.get("slug");

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    paymentMethod: "gcash",
    deliveryAddress: "",
    buyerNotes: "",
  });

  useEffect(() => {
    if (!listingId && !listingSlug) {
      setLoading(false);
      return;
    }

    async function fetchListing() {
      try {
        // If we have a slug, fetch directly by slug (efficient)
        if (listingSlug) {
          const res = await apiGet(`/listings/${listingSlug}`, accessToken || undefined);
          setListing(res);
        } else if (listingId) {
          // Fallback: fetch by ID using query with minimal limit
          const res: any = await apiGet(`/listings?limit=50`, accessToken || undefined);
          const found = (res.data || []).find((l: any) => l.id === listingId);
          if (found) setListing(found);
        }
      } catch {
        // listing not found
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [listingId, listingSlug, accessToken]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listing) return;
    setError("");
    setSubmitting(true);

    try {
      const body: any = {
        listingId: listing.id,
        deliveryAddress: form.deliveryAddress,
        paymentMethod: form.paymentMethod,
      };
      if (form.buyerNotes) {
        body.buyerNotes = form.buyerNotes;
      }

      const order = await apiPost("/orders", body, accessToken!);
      router.push(`/orders/${(order as any).id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold">Listing not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The listing you&apos;re trying to order could not be found.
        </p>
      </div>
    );
  }

  const shippingFee = Number(listing.shippingFee || 0);
  const deliveryMarkup = shippingFee > 0 ? Math.round(shippingFee * 0.15) : 0;
  const platformFee = Math.round(Number(listing.price) * 0.05);
  const total = Number(listing.price) + shippingFee + deliveryMarkup + platformFee;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Place Order</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review your order details before confirming.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Listing Summary */}
      <div className="mt-6 flex gap-4 rounded-xl border border-border p-4">
        <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted" />
        <div>
          <h3 className="font-medium">{listing.title}</h3>
          <p className="text-sm text-muted-foreground capitalize">
            {listing.category} · {listing.breed || "Unknown breed"}
          </p>
          <p className="mt-1 text-lg font-bold text-primary">
            {formatPHP(Number(listing.price))}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Delivery Address */}
        <section>
          <h2 className="mb-3 font-semibold">Delivery Address</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Shipping from {listing.locationCity}, {listing.locationProvince} ({listing.shippingAreas || "local"})
          </p>
          <textarea
            value={form.deliveryAddress}
            onChange={(e) => updateField("deliveryAddress", e.target.value)}
            placeholder="Enter your full delivery address (street, barangay, city, province, zip code)..."
            rows={3}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </section>

        {/* Payment Method */}
        <section>
          <h2 className="mb-3 font-semibold">Payment Method</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PAYMENT_METHODS.map((pm) => (
              <label
                key={pm.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                  form.paymentMethod === pm.value
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={pm.value}
                  checked={form.paymentMethod === pm.value}
                  onChange={(e) => updateField("paymentMethod", e.target.value)}
                />
                <span className="text-sm font-medium">{pm.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section>
          <h2 className="mb-3 font-semibold">Notes (optional)</h2>
          <textarea
            value={form.buyerNotes}
            onChange={(e) => updateField("buyerNotes", e.target.value)}
            placeholder="Any special instructions for the seller..."
            rows={2}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </section>

        {/* Order Summary */}
        <section className="rounded-xl border border-border p-4">
          <h2 className="mb-3 font-semibold">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item price</span>
              <span>{formatPHP(Number(listing.price))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping fee</span>
              <span>{shippingFee > 0 ? formatPHP(shippingFee) : "Free"}</span>
            </div>
            {deliveryMarkup > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery handling</span>
                <span>{formatPHP(deliveryMarkup)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee (5%)</span>
              <span>{formatPHP(platformFee)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPHP(total)}</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Placing order..." : "Place Order"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-input px-6 py-3 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
