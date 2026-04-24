"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatPHP } from "@sabong/shared";
import Link from "next/link";
import { ReleaseCelebration } from "@/components/orders/release-celebration";
import { useToast } from "@/components/toast/notification-toast";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  gcash: "GCash",
  maya: "Maya",
  card: "Credit/Debit Card",
  bank_transfer: "Bank Transfer",
  otc_cash: "Cash (OTC)",
};

const STATUS_STEPS = [
  { key: "payment_pending", label: "Awaiting Payment" },
  { key: "paid", label: "Paid" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

function StarRating({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "lg";
}) {
  const [hover, setHover] = useState(0);
  const starSize = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`${starSize} ${
            onChange ? "cursor-pointer" : "cursor-default"
          } transition-colors ${
            star <= (hover || value)
              ? "text-yellow-400"
              : "text-gray-300"
          }`}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  return <StarRating value={value} size={size} />;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const { show: showToast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSimulating, setPaymentSimulating] = useState(false);

  // Ship modal state
  const [showShipModal, setShowShipModal] = useState(false);
  const [shippingProvider, setShippingProvider] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputePhotos, setDisputePhotos] = useState("");

  // Seller response to review
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responseSubmitting, setResponseSubmitting] = useState(false);

  // Release celebration overlay
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAmount, setCelebrationAmount] = useState(0);

  // Review state
  const [existingReview, setExistingReview] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAccuracy, setReviewAccuracy] = useState(0);
  const [reviewCommunication, setReviewCommunication] = useState(0);
  const [reviewShipping, setReviewShipping] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    // Fetch review for BOTH buyer (to show their posted review)
    // and seller (to show + let them respond).
    if (
      order &&
      accessToken &&
      order.status === "completed" &&
      order.escrowStatus === "released"
    ) {
      fetchReview();
    }
  }, [order?.id, order?.status, order?.escrowStatus]);

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

  async function fetchReview() {
    if (!accessToken || !id) return;
    try {
      const res = await apiGet(`/reviews/order/${id}`, accessToken);
      setExistingReview(res);
    } catch {
      setExistingReview(null);
    }
  }

  async function handleAction(action: string, body: Record<string, any> = {}) {
    if (!accessToken) return;
    setActionLoading(true);
    try {
      await apiPatch(`/orders/${id}/${action}`, body, accessToken);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleShipSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleAction("ship", { trackingNumber, shippingProvider });
    setShowShipModal(false);
    setTrackingNumber("");
    setShippingProvider("");
  }

  async function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleAction("cancel", { cancelReason });
    setShowCancelModal(false);
    setCancelReason("");
  }

  async function handleAcceptDelivery() {
    if (!accessToken) return;
    setActionLoading(true);
    try {
      await apiPost(`/orders/${id}/accept-delivery`, {}, accessToken);
      // Trigger celebration before refetching — amount is final known total
      setCelebrationAmount(Number(order.totalAmount));
      setShowCelebration(true);
      showToast({
        title: "Seller was notified",
        body: "Mang Tomas got your payment release",
        accent: "green",
      });
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || "Failed to accept delivery");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReviewResponse(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !existingReview || !responseText.trim()) return;
    setResponseSubmitting(true);
    try {
      const updated = await apiPatch(
        `/reviews/${existingReview.id}/respond`,
        { response: responseText.trim() },
        accessToken,
      );
      setExistingReview({
        ...existingReview,
        ...(updated as any),
      });
      setShowResponseForm(false);
      setResponseText("");
    } catch (err: any) {
      alert(err.message || "Failed to send response");
    } finally {
      setResponseSubmitting(false);
    }
  }

  async function handleDisputeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setActionLoading(true);
    try {
      const photos = disputePhotos
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);
      await apiPost(
        `/orders/${id}/dispute`,
        { reason: disputeReason, photos },
        accessToken,
      );
      await fetchOrder();
      setShowDisputeModal(false);
      setDisputeReason("");
      setDisputePhotos("");
      showToast({
        title: "Admin notified",
        body: "Your dispute is in review",
        accent: "amber",
      });
    } catch (err: any) {
      alert(err.message || "Failed to open dispute");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePayment() {
    if (!accessToken || !order?.payments?.[0]) return;
    setPaymentProcessing(true);

    try {
      const res: any = await apiPost(
        `/orders/${id}/pay`,
        { paymentMethod: order.payments[0].method },
        accessToken,
      );

      // Real PayMongo flow: redirect to the hosted checkout URL.
      if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }

      // Simulated flow: show a brief processing indicator, then refresh.
      setPaymentSimulating(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPaymentSimulating(false);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || "Payment failed");
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || reviewRating === 0) return;
    setReviewSubmitting(true);
    try {
      const body: any = {
        orderId: id,
        rating: reviewRating,
      };
      if (reviewTitle.trim()) body.title = reviewTitle.trim();
      if (reviewComment.trim()) body.comment = reviewComment.trim();
      if (reviewAccuracy > 0) body.accuracyRating = reviewAccuracy;
      if (reviewCommunication > 0) body.communicationRating = reviewCommunication;
      if (reviewShipping > 0) body.shippingRating = reviewShipping;

      const review = await apiPost("/reviews", body, accessToken);
      setExistingReview(review);
      setShowReviewForm(false);
    } catch (err: any) {
      alert(err.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
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
  // order.sellerId is the seller_profile id, not user id — compare via nested seller.userId
  const isSeller = order.seller?.userId === user?.id;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";
  // Review is only offered after funds are released (buyer accepted)
  const canReview =
    isBuyer &&
    order.status === "completed" &&
    order.escrowStatus === "released" &&
    !existingReview;

  return (
    <div>
      {showCelebration && (
        <ReleaseCelebration
          amount={celebrationAmount}
          onClose={() => setShowCelebration(false)}
        />
      )}

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

      {/* Escrow Banner */}
      {order.escrowStatus && order.escrowStatus !== "none" && (
        <div
          className={`mb-6 rounded-xl border p-4 sm:p-5 ${
            order.escrowStatus === "held"
              ? "border-amber-200 bg-amber-50"
              : order.escrowStatus === "released"
                ? "border-green-200 bg-green-50"
                : order.escrowStatus === "disputed"
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                order.escrowStatus === "held"
                  ? "bg-amber-100 text-amber-700"
                  : order.escrowStatus === "released"
                    ? "bg-green-100 text-green-700"
                    : order.escrowStatus === "disputed"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
              }`}
            >
              {order.escrowStatus === "released" ? "✓" : order.escrowStatus === "disputed" ? "!" : "🔒"}
            </div>
            <div className="flex-1 text-sm">
              <p
                className={`font-semibold ${
                  order.escrowStatus === "held"
                    ? "text-amber-900"
                    : order.escrowStatus === "released"
                      ? "text-green-900"
                      : order.escrowStatus === "disputed"
                        ? "text-red-900"
                        : "text-gray-900"
                }`}
              >
                {order.escrowStatus === "held" &&
                  `Escrow: ${formatPHP(Number(order.totalAmount))} held safely`}
                {order.escrowStatus === "released" &&
                  `Payment released to seller — ${formatPHP(Number(order.totalAmount))}`}
                {order.escrowStatus === "disputed" &&
                  "Under dispute — admin is reviewing"}
                {order.escrowStatus === "refunded" &&
                  "Payment refunded to buyer"}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  order.escrowStatus === "held"
                    ? "text-amber-700"
                    : order.escrowStatus === "released"
                      ? "text-green-700"
                      : order.escrowStatus === "disputed"
                        ? "text-red-700"
                        : "text-gray-700"
                }`}
              >
                {order.escrowStatus === "held" &&
                  (isBuyer
                    ? "Ang bayad mo ay safe hanggang matanggap mo ang manok."
                    : "Ang bayad ng buyer ay naka-hold. Released once the buyer confirms receipt.")}
                {order.escrowStatus === "released" &&
                  (isBuyer
                    ? "You accepted the delivery. Transaction complete."
                    : `Funds released on ${new Date(order.escrowReleasedAt || order.completedAt).toLocaleDateString("en-PH")}`)}
                {order.escrowStatus === "disputed" &&
                  "A decision will be made within 24 hours."}
                {order.escrowStatus === "refunded" &&
                  "The dispute was resolved in favor of the buyer."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dispute context — visible to buyer + seller when escrow is disputed */}
      {order.escrowStatus === "disputed" && order.buyerNotes && (
        <div className="mb-6 rounded-xl border border-red-300 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
              ⚠
            </div>
            <div className="flex-1 space-y-2 text-sm">
              <p className="font-semibold text-red-900">
                {isSeller
                  ? "Buyer reported an issue"
                  : "Your dispute is being reviewed"}
              </p>
              <pre className="whitespace-pre-wrap break-words font-sans text-red-900/90">
                {order.buyerNotes}
              </pre>
              <p className="text-xs text-red-700">
                {isSeller
                  ? "An admin will review and decide whether to release or refund. You can message the buyer to try to resolve amicably."
                  : "An admin will review and make a decision within 24 hours."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Progress */}
      {!isCancelled && (
        <div className="mb-8 rounded-xl border border-border p-4 sm:p-6">
          <h2 className="mb-4 font-semibold">Order Status</h2>
          <div className="flex items-center justify-between overflow-x-auto">
            {STATUS_STEPS.map((step, i) => (
              <div key={step.key} className="flex flex-1 items-center min-w-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i <= currentStepIndex
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i <= currentStepIndex ? "\u2713" : i + 1}
                  </div>
                  <span className="mt-1 text-[10px] sm:text-xs text-center whitespace-nowrap">{step.label}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`mx-1 sm:mx-2 h-0.5 flex-1 ${
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

      {/* Pay Now Section — shown to buyer when payment is pending */}
      {isBuyer && (order.status === "pending" || order.status === "payment_pending") && order.payments?.[0] && (
        <div className="mb-8 rounded-xl border-2 border-primary/50 bg-primary/5 p-6">
          <h2 className="mb-4 text-lg font-bold">Complete Payment</h2>

          <div className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium">
                {PAYMENT_METHOD_LABELS[order.payments[0].method] || order.payments[0].method}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Due</span>
              <span className="text-lg font-bold text-primary">
                {formatPHP(Number(order.totalAmount))}
              </span>
            </div>
          </div>

          {/* Simulated payment UI */}
          {(order.payments[0].method === "gcash" || order.payments[0].method === "maya") && (
            <div className="mb-4 rounded-lg border border-border bg-background p-4 text-center">
              <div className="mx-auto mb-2 flex h-32 w-32 items-center justify-center rounded-lg bg-muted">
                <div className="text-center">
                  <div className="text-3xl font-bold text-muted-foreground">QR</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Simulated</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Scan with {PAYMENT_METHOD_LABELS[order.payments[0].method]} app to pay
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground italic">
                (MVP: Click the button below to simulate payment)
              </p>
            </div>
          )}

          {order.payments[0].method === "bank_transfer" && (
            <div className="mb-4 rounded-lg border border-border bg-background p-4 text-sm">
              <p className="font-medium mb-2">Bank Transfer Details (Simulated)</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Bank: BDO Unibank</p>
                <p>Account Name: BloodlinePH Escrow</p>
                <p>Account Number: **** **** 1234</p>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground italic">
                (MVP: Click the button below to simulate payment)
              </p>
            </div>
          )}

          {order.payments[0].method === "otc_cash" && (
            <div className="mb-4 rounded-lg border border-border bg-background p-4 text-sm">
              <p className="font-medium mb-2">Over-the-Counter Payment (Simulated)</p>
              <p className="text-muted-foreground">
                Visit any 7-Eleven, Cebuana, or M Lhuillier branch and quote reference number:
              </p>
              <p className="mt-1 font-mono font-bold text-center text-lg">{order.orderNumber}</p>
              <p className="mt-2 text-[10px] text-muted-foreground italic">
                (MVP: Click the button below to simulate payment)
              </p>
            </div>
          )}

          {paymentSimulating ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm font-medium text-primary">Processing payment...</p>
            </div>
          ) : (
            <button
              onClick={handlePayment}
              disabled={paymentProcessing}
              className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {paymentProcessing ? "Processing..." : "Confirm Payment"}
            </button>
          )}
        </div>
      )}

      {/* Order Details */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item Price</span>
              <span>{formatPHP(Number(order.itemPrice))}</span>
            </div>
            {Number(order.shippingFee) > 0 && !isSeller && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Logistics &amp; handling
                </span>
                <span>{formatPHP(Number(order.shippingFee))}</span>
              </div>
            )}
            {isSeller && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>- Platform Fee (5%)</span>
                <span>- {formatPHP(Number(order.platformFee))}</span>
              </div>
            )}
            <div className="border-t pt-3">
              {isSeller ? (
                <>
                  <div className="flex justify-between font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Your Payout
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {formatPHP(
                        Number(order.itemPrice) -
                          Number(order.platformFee || 0),
                      )}
                    </span>
                  </div>
                  <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    🚚 BloodlinePH handles the logistics — we pick up the
                    bird, keep it at our holding farm, and deliver in batch.
                    No shipping fee in your payout.
                  </p>
                </>
              ) : (
                <div className="flex justify-between font-bold">
                  <span>Total {isBuyer ? "Paid" : "Amount"}</span>
                  <span>{formatPHP(Number(order.totalAmount))}</span>
                </div>
              )}
              {isBuyer && (
                <p className="mt-2 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                  ✓ No platform fee for buyers — seller shoulders the 5%.
                  Logistics covers pickup + holding farm + batch delivery
                  handled by BloodlinePH.
                </p>
              )}
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
            {order.deliveryAddress && (
              <p>
                <span className="text-muted-foreground">Address: </span>
                {order.deliveryAddress}
              </p>
            )}
            {order.meetupLocation && (
              <p>
                <span className="text-muted-foreground">Meet-up Location: </span>
                {order.meetupLocation}
              </p>
            )}
            {order.shippingProvider && (
              <p>
                <span className="text-muted-foreground">Shipping Provider: </span>
                {order.shippingProvider}
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
      <div className="mt-6 flex flex-wrap gap-3">
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
            onClick={() => setShowShipModal(true)}
            disabled={actionLoading}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Mark as Shipped
          </button>
        )}
        {isBuyer &&
          order.status === "shipped" &&
          order.escrowStatus !== "disputed" && (
            <>
              <button
                onClick={() => handleAction("deliver")}
                disabled={actionLoading}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Confirm Delivery
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                disabled={actionLoading}
                className="rounded-lg border border-red-300 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Report Problem
              </button>
            </>
          )}
        {isBuyer &&
          order.status === "delivered" &&
          order.escrowStatus === "held" && (
            <>
              <button
                onClick={handleAcceptDelivery}
                disabled={actionLoading}
                className="flex-1 sm:flex-none rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading
                  ? "Processing..."
                  : `✓ Accept & Release ${formatPHP(Number(order.totalAmount))}`}
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                disabled={actionLoading}
                className="rounded-lg border border-red-300 px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                ⚠ Report Problem
              </button>
            </>
          )}
        {(order.status === "pending" || order.status === "payment_pending") && (
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={actionLoading}
            className="rounded-lg border border-red-300 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Review Section — only visible after escrow released (buyer + seller) */}
      {(isBuyer || isSeller) &&
        order.status === "completed" &&
        order.escrowStatus === "released" && (
        <div className="mt-8">
          {existingReview ? (
            <div className="rounded-xl border border-border p-6">
              <h2 className="mb-4 font-semibold">
                {isBuyer ? "Your Review" : "Buyer's Review"}
              </h2>
              <div className="space-y-3">
                <StarDisplay value={existingReview.rating} size="lg" />
                {existingReview.title && (
                  <p className="font-medium">{existingReview.title}</p>
                )}
                {existingReview.comment && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {existingReview.comment}
                  </p>
                )}
                {(existingReview.accuracyRating || existingReview.communicationRating || existingReview.shippingRating) && (
                  <div className="flex flex-wrap gap-4 pt-2 text-sm">
                    {existingReview.accuracyRating > 0 && (
                      <div>
                        <span className="text-muted-foreground">Accuracy: </span>
                        <StarDisplay value={existingReview.accuracyRating} />
                      </div>
                    )}
                    {existingReview.communicationRating > 0 && (
                      <div>
                        <span className="text-muted-foreground">Communication: </span>
                        <StarDisplay value={existingReview.communicationRating} />
                      </div>
                    )}
                    {existingReview.shippingRating > 0 && (
                      <div>
                        <span className="text-muted-foreground">Shipping: </span>
                        <StarDisplay value={existingReview.shippingRating} />
                      </div>
                    )}
                  </div>
                )}
                {existingReview.sellerResponse && (
                  <div className="mt-4 rounded-lg bg-muted/50 p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Seller Response</p>
                    <p className="text-sm whitespace-pre-wrap">{existingReview.sellerResponse}</p>
                  </div>
                )}

                {/* Seller: reply to review if not yet responded */}
                {isSeller && !existingReview.sellerResponse && (
                  <div className="mt-4">
                    {showResponseForm ? (
                      <form
                        onSubmit={handleReviewResponse}
                        className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
                      >
                        <label className="block text-sm font-medium">
                          Your response to this buyer
                        </label>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Thank the buyer, address their feedback, or add context…"
                          rows={3}
                          maxLength={1000}
                          required
                          className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={responseSubmitting || !responseText.trim()}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                          >
                            {responseSubmitting ? "Sending…" : "Post Response"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowResponseForm(false);
                              setResponseText("");
                            }}
                            className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowResponseForm(true)}
                        className="w-full rounded-lg border-2 border-dashed border-primary/30 p-4 text-sm font-semibold text-primary hover:border-primary/50 hover:bg-primary/5"
                      >
                        💬 Respond to this review
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : isSeller ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Waiting for buyer to leave a review.
              </p>
            </div>
          ) : showReviewForm ? (
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
              <h2 className="mb-4 text-lg font-bold">Leave a Review</h2>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Overall Rating */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Overall Rating <span className="text-red-500">*</span>
                  </label>
                  <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
                  {reviewRating === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">Click to rate</p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Title (optional)</label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Summarize your experience"
                    maxLength={200}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Comment (optional)</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share details of your experience with this seller..."
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-xs text-muted-foreground text-right">
                    {reviewComment.length}/2000
                  </p>
                </div>

                {/* Sub-ratings */}
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-medium">Detailed Ratings (optional)</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Accuracy
                      </label>
                      <StarRating
                        value={reviewAccuracy}
                        onChange={setReviewAccuracy}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Communication
                      </label>
                      <StarRating
                        value={reviewCommunication}
                        onChange={setReviewCommunication}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Shipping
                      </label>
                      <StarRating
                        value={reviewShipping}
                        onChange={setReviewShipping}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={reviewSubmitting || reviewRating === 0}
                    className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full rounded-xl border-2 border-dashed border-primary/30 p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <p className="text-lg font-semibold text-primary">Leave a Review</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Share your experience with this seller
              </p>
            </button>
          )}
        </div>
      )}

      {/* Ship Modal */}
      {showShipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background border border-border p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Shipping Details</h2>
            <form onSubmit={handleShipSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Shipping Provider</label>
                <input
                  type="text"
                  value={shippingProvider}
                  onChange={(e) => setShippingProvider(e.target.value)}
                  placeholder="e.g. J&T Express, LBC, JRS"
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Confirm Shipment"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowShipModal(false)}
                  className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-background border border-border p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold">Report a Problem</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Open a dispute. The escrow will be held until an admin reviews
              your report (usually within 24 hours).
            </p>
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  What happened? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue: e.g. bird arrived injured, not as described, wrong breed…"
                  rows={4}
                  maxLength={1000}
                  required
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Photo URLs (optional)
                </label>
                <textarea
                  value={disputePhotos}
                  onChange={(e) => setDisputePhotos(e.target.value)}
                  placeholder="Paste photo URLs, one per line. You can upload photos to your phone/cloud and paste links here."
                  rows={3}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Clearer evidence helps admin resolve faster.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading || !disputeReason.trim()}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? "Submitting…" : "Submit Dispute"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  Go Back
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background border border-border p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Cancel Order</h2>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Reason for cancellation</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this order..."
                  rows={3}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? "Cancelling..." : "Confirm Cancellation"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Go Back
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
