/**
 * Orders data layer — react-query hooks wrapping /orders endpoints.
 * Matches the NestJS OrdersController.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost } from "./api";

export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "paid"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentMethod =
  | "gcash"
  | "maya"
  | "card"
  | "bank_transfer"
  | "otc_cash";

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: PaymentMethod | null;
  itemPrice: string;
  platformFee: string;
  shippingFee: string | null;
  totalAmount: string;
  deliveryAddress: string | null;
  trackingNumber: string | null;
  shippingProvider: string | null;
  buyerNotes: string | null;
  sellerNotes: string | null;
  createdAt: string;
  updatedAt: string;

  // Enriched by the API (optional so old clients still work)
  listing?: {
    id: string;
    title: string;
    slug: string;
    breed: string | null;
    bloodline: string | null;
  } | null;
  listingImage?: string | null;
  seller?: {
    farmName: string | null;
    avgRating: string | null;
    verificationStatus: string | null;
  } | null;

  // Step timestamps for the tracker
  paidAt?: string | null;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;

  // Escrow — drives the 'safe hold' UX
  escrowStatus?: "none" | "held" | "released" | "refunded" | "disputed";
  escrowReleasedAt?: string | null;
}

export interface CreateOrderInput {
  listingId: string;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  buyerNotes?: string;
}

export function useMyOrders() {
  return useQuery<{ data: Order[] }, Error>({
    queryKey: ["orders"],
    queryFn: () => apiGet<{ data: Order[] }>("/orders"),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery<Order, Error>({
    queryKey: ["orders", id],
    enabled: !!id,
    queryFn: () => apiGet<Order>(`/orders/${id}`),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation<Order, Error, CreateOrderInput>({
    mutationFn: (input) => apiPost<Order>("/orders", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/** Buyer → POST /orders/:id/accept-delivery → releases escrow + completes. */
export function useAcceptDelivery(orderId: string) {
  const qc = useQueryClient();
  return useMutation<{ status: string }, Error, void>({
    mutationFn: () =>
      apiPost<{ status: string }>(`/orders/${orderId}/accept-delivery`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
    },
  });
}

/** Buyer → POST /orders/:id/dispute with reason + photos → escrow=disputed. */
export function useDisputeOrder(orderId: string) {
  const qc = useQueryClient();
  return useMutation<
    { escrowStatus: string },
    Error,
    { reason: string; photos?: string[] }
  >({
    mutationFn: (input) =>
      apiPost<{ escrowStatus: string }>(`/orders/${orderId}/dispute`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
    },
  });
}

export function usePayOrder(orderId: string) {
  const qc = useQueryClient();
  return useMutation<
    { checkoutUrl?: string; status: string } & Partial<Order>,
    Error,
    { paymentMethod: PaymentMethod }
  >({
    mutationFn: (input) => apiPost(`/orders/${orderId}/pay`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders", orderId] });
    },
  });
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  gcash: "GCash",
  maya: "Maya",
  card: "Credit / Debit Card",
  bank_transfer: "Bank Transfer",
  otc_cash: "Cash (Over the Counter)",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  payment_pending: "Awaiting Payment",
  paid: "Paid",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function formatOrderPrice(value: string | null | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}
