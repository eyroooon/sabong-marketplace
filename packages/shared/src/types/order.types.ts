export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "paid"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed"
  | "resolved";

export type DeliveryMethod = "shipping";

export type PaymentMethod =
  | "gcash"
  | "maya"
  | "card"
  | "bank_transfer"
  | "otc_cash";

export type PaymentProvider = "paymongo" | "dragonpay";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded";

export type EscrowStatus = "none" | "held" | "released" | "refunded";

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  itemPrice: number;
  shippingFee: number;
  platformFee: number;
  totalAmount: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod | null;
  deliveryAddress: string | null;
  trackingNumber: string | null;
  shippingProvider: string | null;
  escrowStatus: EscrowStatus;
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
