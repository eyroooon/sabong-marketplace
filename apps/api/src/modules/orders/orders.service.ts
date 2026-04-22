import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  orders,
  payments,
  listings,
  listingImages,
  sellerProfiles,
  users,
} from "../../database/schema";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/create-order.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { PayMongoService } from "./paymongo.service";

const PLATFORM_FEE_RATE = 0.05; // 5% commission
const DELIVERY_MARKUP_RATE = 0.15; // 15% markup on shipping fee

// E-wallet/card methods supported by PayMongo.
const PAYMONGO_METHODS = new Set(["gcash", "maya", "card"]);

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(DRIZZLE) private db: any,
    private notificationsService: NotificationsService,
    private paymongo: PayMongoService,
    private config: ConfigService,
  ) {}

  async create(buyerId: string, dto: CreateOrderDto) {
    // Get listing
    const [listing] = await this.db
      .select()
      .from(listings)
      .where(
        and(eq(listings.id, dto.listingId), eq(listings.status, "active")),
      )
      .limit(1);

    if (!listing) {
      throw new NotFoundException("Listing not found or no longer available");
    }

    // Prevent buying own listing
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, listing.sellerId))
      .limit(1);

    if (seller?.userId === buyerId) {
      throw new BadRequestException("You cannot buy your own listing");
    }

    // Delivery address is required — shipping only
    if (!dto.deliveryAddress) {
      throw new BadRequestException(
        "Delivery address is required",
      );
    }

    const itemPrice = Number(listing.price);
    const shippingFee = Number(listing.shippingFee || 0);
    const deliveryMarkup = shippingFee > 0 ? Math.round(shippingFee * DELIVERY_MARKUP_RATE) : 0;
    const platformFee = Math.round(itemPrice * PLATFORM_FEE_RATE * 100) / 100;
    const totalAmount = itemPrice + shippingFee + deliveryMarkup + platformFee;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    const [order] = await this.db
      .insert(orders)
      .values({
        orderNumber,
        buyerId,
        sellerId: listing.sellerId,
        listingId: listing.id,
        itemPrice: itemPrice.toString(),
        shippingFee: shippingFee.toString(),
        platformFee: platformFee.toString(),
        totalAmount: totalAmount.toString(),
        status: "payment_pending",
        deliveryMethod: "shipping",
        deliveryAddress: dto.deliveryAddress,
        buyerNotes: dto.buyerNotes,
        escrowStatus: "none",
      })
      .returning();

    // Create payment record
    const [payment] = await this.db
      .insert(payments)
      .values({
        orderId: order.id,
        amount: totalAmount.toString(),
        currency: "PHP",
        method: dto.paymentMethod,
        provider: dto.paymentMethod === "otc_cash" ? "dragonpay" : "paymongo",
        status: "pending",
      })
      .returning();

    // Mark listing as reserved
    await this.db
      .update(listings)
      .set({ status: "reserved", updatedAt: new Date() })
      .where(eq(listings.id, listing.id));

    // Notify seller about new order
    if (seller?.userId) {
      this.notificationsService
        .create({
          userId: seller.userId,
          type: "order_placed",
          title: "New order received",
          body: `You have a new order (${order.orderNumber}) for your listing.`,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        })
        .catch(() => {}); // Fire and forget
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount,
      payment: {
        id: payment.id,
        method: payment.method,
        status: payment.status,
      },
    };
  }

  async getMyOrders(userId: string, role?: string) {
    // Get orders where user is buyer or seller
    const [sellerProfile] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId))
      .limit(1);

    let condition;
    if (sellerProfile) {
      condition = or(
        eq(orders.buyerId, userId),
        eq(orders.sellerId, sellerProfile.id),
      );
    } else {
      condition = eq(orders.buyerId, userId);
    }

    const data = await this.db
      .select()
      .from(orders)
      .where(condition)
      .orderBy(desc(orders.createdAt));

    // Enrich with listing title/breed and primary image so the orders list
    // screen can render a proper card without a second round-trip per order.
    if (data.length === 0) return { data: [] };

    const listingIds = [...new Set(data.map((o: any) => o.listingId))];
    const listingRows = await this.db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        breed: listings.breed,
        bloodline: listings.bloodline,
      })
      .from(listings)
      .where(sql`${listings.id} IN ${listingIds}`);
    const listingMap = new Map(listingRows.map((l: any) => [l.id, l]));

    const imageRows = await this.db
      .select()
      .from(listingImages)
      .where(
        and(
          eq(listingImages.isPrimary, true),
          sql`${listingImages.listingId} IN ${listingIds}`,
        ),
      );
    const imageMap = new Map(imageRows.map((i: any) => [i.listingId, i.url]));

    const enriched = data.map((order: any) => ({
      ...order,
      listing: listingMap.get(order.listingId) || null,
      listingImage: imageMap.get(order.listingId) || null,
    }));

    return { data: enriched };
  }

  async getById(orderId: string, userId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Verify access
    const [sellerProfile] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, order.sellerId))
      .limit(1);

    if (order.buyerId !== userId && sellerProfile?.userId !== userId) {
      throw new ForbiddenException("You do not have access to this order");
    }

    // Get listing, payment, buyer/seller info
    const [listing] = await this.db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        breed: listings.breed,
        bloodline: listings.bloodline,
      })
      .from(listings)
      .where(eq(listings.id, order.listingId))
      .limit(1);

    // Primary image for the listing (for the hero/summary card in detail view)
    const [primaryImage] = await this.db
      .select()
      .from(listingImages)
      .where(
        and(
          eq(listingImages.listingId, order.listingId),
          eq(listingImages.isPrimary, true),
        ),
      )
      .limit(1);

    const paymentRecords = await this.db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id));

    const [buyer] = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, order.buyerId))
      .limit(1);

    return {
      ...order,
      listing,
      listingImage: primaryImage?.url || null,
      payments: paymentRecords,
      buyer,
      seller: sellerProfile,
    };
  }

  async payOrder(orderId: string, userId: string, paymentMethod: string) {
    const order = await this.getOrderForBuyer(orderId, userId);

    if (!["pending", "payment_pending"].includes(order.status)) {
      throw new BadRequestException(
        "Order must be in pending or payment_pending status to pay",
      );
    }

    // Use real PayMongo if configured AND the payment method is one it handles
    // (gcash / maya / card). Otherwise fall back to the simulated flow below.
    if (
      this.paymongo.isConfigured() &&
      PAYMONGO_METHODS.has(paymentMethod)
    ) {
      return this.initiatePayMongoPayment(order, paymentMethod);
    }

    // --- Simulated payment fallback (used for dev/testing) -----------------
    const simulatedPaymentId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Update payment record
    await this.db
      .update(payments)
      .set({
        status: "completed",
        paidAt: new Date(),
        providerPaymentId: simulatedPaymentId,
        providerResponse: JSON.stringify({
          simulated: true,
          provider: paymentMethod === "otc_cash" ? "dragonpay" : "paymongo",
          method: paymentMethod,
          processedAt: new Date().toISOString(),
        }),
        updatedAt: new Date(),
      })
      .where(eq(payments.orderId, orderId));

    // Update order status
    const [updated] = await this.db
      .update(orders)
      .set({
        status: "paid",
        paidAt: new Date(),
        escrowStatus: "held",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Notify seller that payment was received
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, order.sellerId))
      .limit(1);

    if (seller?.userId) {
      this.notificationsService
        .create({
          userId: seller.userId,
          type: "payment_received",
          title: "Payment received",
          body: `Payment for order ${order.orderNumber} has been received. Please confirm the order.`,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        })
        .catch(() => {});
    }

    return { id: updated.id, status: updated.status, escrowStatus: updated.escrowStatus };
  }

  /**
   * Start a real PayMongo payment: creates a Source (for e-wallets) or a
   * Payment Intent (for cards) and returns a checkout URL for the buyer.
   * The order stays in `payment_pending` until a webhook confirms payment.
   */
  private async initiatePayMongoPayment(order: any, paymentMethod: string) {
    const webUrl = this.config.get<string>("WEB_URL", "http://localhost:3000");
    const successUrl = `${webUrl}/orders/${order.id}?payment=success`;
    const failedUrl = `${webUrl}/orders/${order.id}?payment=failed`;
    const amount = Number(order.totalAmount);

    const metadata = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
    };

    let checkoutUrl: string | null = null;
    let providerId = "";
    let providerType: "source" | "payment_intent" = "source";
    let providerResponse: any;

    try {
      if (paymentMethod === "card") {
        const intent = await this.paymongo.createPaymentIntent(
          amount,
          `BloodlinePH order ${order.orderNumber}`,
          metadata,
        );
        providerId = intent.data.id;
        providerType = "payment_intent";
        providerResponse = intent;
        // Cards do not get a simple hosted-checkout URL; the frontend uses
        // the client_key to attach a Payment Method. Surface the client_key
        // via the redirect URL so the web app can handle it.
        checkoutUrl = `${webUrl}/orders/${order.id}?pi=${intent.data.id}`;
      } else {
        const ewalletType: "gcash" | "paymaya" =
          paymentMethod === "maya" ? "paymaya" : "gcash";
        const source = await this.paymongo.createSource(
          ewalletType,
          amount,
          successUrl,
          failedUrl,
          metadata,
        );
        providerId = source.data.id;
        providerType = "source";
        providerResponse = source;
        checkoutUrl = source.data.attributes.redirect.checkout_url;
      }
    } catch (err: any) {
      this.logger.error(
        `PayMongo initiation failed for order ${order.orderNumber}: ${err.message}`,
      );
      throw new BadRequestException(
        "Unable to start payment. Please try again.",
      );
    }

    // Update payment record to track the provider reference.
    await this.db
      .update(payments)
      .set({
        status: "pending",
        providerPaymentId: providerId,
        providerResponse: JSON.stringify({
          provider: "paymongo",
          providerType,
          method: paymentMethod,
          response: providerResponse,
        }),
        updatedAt: new Date(),
      })
      .where(eq(payments.orderId, order.id));

    return {
      orderId: order.id,
      status: "payment_pending",
      checkoutUrl,
      provider: "paymongo",
      providerType,
      providerId,
    };
  }

  /**
   * Handle a PayMongo webhook. Verifies the signature and, for
   * `source.chargeable` / `payment.paid` events, marks the order paid
   * and updates escrow.
   */
  async handlePayMongoWebhook(rawBody: string, signatureHeader: string) {
    const secret = this.paymongo.getWebhookSecret();
    if (!secret) {
      this.logger.warn(
        "Received PayMongo webhook but PAYMONGO_WEBHOOK_SECRET is not configured",
      );
      throw new UnauthorizedException("Webhook secret not configured");
    }
    if (
      !this.paymongo.verifyWebhookSignature(rawBody, signatureHeader, secret)
    ) {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException("Invalid webhook payload");
    }

    const attrs = event?.data?.attributes || {};
    const eventType: string = attrs.type || "";
    const dataObj = attrs?.data;

    this.logger.log(`PayMongo webhook event: ${eventType}`);

    if (eventType === "source.chargeable") {
      // Source is ready to be charged. Create the Payment, then mark the
      // order as paid.
      const sourceId = dataObj?.id;
      const metadata = dataObj?.attributes?.metadata || {};
      const orderId = metadata.orderId;
      if (!orderId) {
        this.logger.warn(
          `source.chargeable missing orderId metadata (source ${sourceId})`,
        );
        return { received: true };
      }
      const [order] = await this.db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);
      if (!order) {
        this.logger.warn(
          `source.chargeable references unknown order ${orderId}`,
        );
        return { received: true };
      }
      if (order.status === "paid" || order.status === "completed") {
        return { received: true, alreadyPaid: true };
      }
      try {
        await this.paymongo.createPaymentFromSource(
          sourceId,
          Number(order.totalAmount),
          `BloodlinePH order ${order.orderNumber}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to create PayMongo payment from source ${sourceId}: ${err.message}`,
        );
        // Continue and still mark paid on payment.paid event.
        return { received: true, error: err.message };
      }
      await this.markOrderPaid(order, sourceId);
      return { received: true, orderId };
    }

    if (eventType === "payment.paid") {
      const paymentId = dataObj?.id;
      const metadata = dataObj?.attributes?.metadata || {};
      let orderId: string | undefined = metadata.orderId;

      // Fallback: look up order via stored providerPaymentId.
      if (!orderId && paymentId) {
        const [pay] = await this.db
          .select()
          .from(payments)
          .where(eq(payments.providerPaymentId, paymentId))
          .limit(1);
        if (pay) orderId = pay.orderId;
      }

      if (!orderId) {
        this.logger.warn(
          `payment.paid missing orderId metadata (payment ${paymentId})`,
        );
        return { received: true };
      }
      const [order] = await this.db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);
      if (!order) return { received: true };
      if (order.status === "paid" || order.status === "completed") {
        return { received: true, alreadyPaid: true };
      }
      await this.markOrderPaid(order, paymentId || "paymongo-paid");
      return { received: true, orderId };
    }

    // Unhandled event types are acknowledged so PayMongo stops retrying.
    return { received: true, ignored: eventType };
  }

  /**
   * Shared helper: mark the order as paid, update escrow, update the payment
   * record, and notify the seller. Idempotent against already-paid orders.
   */
  private async markOrderPaid(order: any, providerPaymentId: string) {
    await this.db
      .update(payments)
      .set({
        status: "completed",
        paidAt: new Date(),
        providerPaymentId,
        updatedAt: new Date(),
      })
      .where(eq(payments.orderId, order.id));

    await this.db
      .update(orders)
      .set({
        status: "paid",
        paidAt: new Date(),
        escrowStatus: "held",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, order.sellerId))
      .limit(1);
    if (seller?.userId) {
      this.notificationsService
        .create({
          userId: seller.userId,
          type: "payment_received",
          title: "Payment received",
          body: `Payment for order ${order.orderNumber} has been received. Please confirm the order.`,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        })
        .catch(() => {});
    }
  }

  async confirmOrder(orderId: string, userId: string) {
    const order = await this.getOrderForSeller(orderId, userId);

    if (order.status !== "paid") {
      throw new BadRequestException("Order must be paid before confirming");
    }

    const [updated] = await this.db
      .update(orders)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Notify buyer
    this.notificationsService
      .create({
        userId: order.buyerId,
        type: "order_confirmed",
        title: "Order confirmed",
        body: `Your order ${order.orderNumber} has been confirmed by the seller.`,
        data: { orderId: order.id },
      })
      .catch(() => {});

    return { id: updated.id, status: updated.status };
  }

  async shipOrder(orderId: string, userId: string, dto: UpdateOrderStatusDto) {
    const order = await this.getOrderForSeller(orderId, userId);

    if (order.status !== "confirmed") {
      throw new BadRequestException("Order must be confirmed before shipping");
    }

    const [updated] = await this.db
      .update(orders)
      .set({
        status: "shipped",
        shippedAt: new Date(),
        trackingNumber: dto.trackingNumber,
        shippingProvider: dto.shippingProvider,
        sellerNotes: dto.sellerNotes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Notify buyer
    this.notificationsService
      .create({
        userId: order.buyerId,
        type: "order_shipped",
        title: "Order shipped",
        body: `Your order ${order.orderNumber} has been shipped.${dto.trackingNumber ? ` Tracking: ${dto.trackingNumber}` : ""}`,
        data: { orderId: order.id },
      })
      .catch(() => {});

    return { id: updated.id, status: updated.status };
  }

  async confirmDelivery(orderId: string, userId: string) {
    const order = await this.getOrderForBuyer(orderId, userId);

    if (order.status !== "shipped") {
      throw new BadRequestException("Order must be shipped before confirming delivery");
    }

    const [updated] = await this.db
      .update(orders)
      .set({
        status: "delivered",
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    return { id: updated.id, status: updated.status };
  }

  async completeOrder(orderId: string, userId: string) {
    const order = await this.getOrderForBuyer(orderId, userId);

    if (order.status !== "delivered") {
      throw new BadRequestException("Order must be delivered before completing");
    }

    const [updated] = await this.db
      .update(orders)
      .set({
        status: "completed",
        completedAt: new Date(),
        escrowStatus: "released",
        escrowReleasedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Mark listing as sold
    await this.db
      .update(listings)
      .set({ status: "sold", updatedAt: new Date() })
      .where(eq(listings.id, order.listingId));

    // Update seller stats
    await this.db
      .update(sellerProfiles)
      .set({
        totalSales: sql`${sellerProfiles.totalSales} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sellerProfiles.id, order.sellerId));

    // Notify seller about completion
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, order.sellerId))
      .limit(1);
    if (seller?.userId) {
      this.notificationsService
        .create({
          userId: seller.userId,
          type: "order_completed",
          title: "Order completed",
          body: `Order ${order.orderNumber} has been completed. Payment released.`,
          data: { orderId: order.id },
        })
        .catch(() => {});
    }

    return { id: updated.id, status: updated.status };
  }

  async cancelOrder(orderId: string, userId: string, dto: UpdateOrderStatusDto) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Only buyer or seller can cancel
    const [sellerProfile] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, order.sellerId))
      .limit(1);

    if (order.buyerId !== userId && sellerProfile?.userId !== userId) {
      throw new ForbiddenException("You cannot cancel this order");
    }

    if (!["pending", "payment_pending", "paid"].includes(order.status)) {
      throw new BadRequestException("This order cannot be cancelled");
    }

    const [updated] = await this.db
      .update(orders)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: dto.cancelReason,
        escrowStatus: order.escrowStatus === "held" ? "refunded" : order.escrowStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Restore listing to active
    await this.db
      .update(listings)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(listings.id, order.listingId));

    // Notify the other party about cancellation
    const cancelledByBuyer = order.buyerId === userId;
    if (cancelledByBuyer) {
      // Notify seller
      const [seller] = await this.db
        .select()
        .from(sellerProfiles)
        .where(eq(sellerProfiles.id, order.sellerId))
        .limit(1);
      if (seller?.userId) {
        this.notificationsService
          .create({
            userId: seller.userId,
            type: "order_cancelled",
            title: "Order cancelled",
            body: `Order ${order.orderNumber} was cancelled by the buyer.`,
            data: { orderId: order.id },
          })
          .catch(() => {});
      }
    } else {
      // Notify buyer
      this.notificationsService
        .create({
          userId: order.buyerId,
          type: "order_cancelled",
          title: "Order cancelled",
          body: `Order ${order.orderNumber} was cancelled by the seller.`,
          data: { orderId: order.id },
        })
        .catch(() => {});
    }

    return { id: updated.id, status: updated.status };
  }

  /**
   * Buyer accepts delivery — releases escrow + completes the order.
   * This is semantically equivalent to completeOrder but named for the
   * buyer-facing "Accept & Release Payment" button.
   */
  async acceptDelivery(orderId: string, userId: string) {
    return this.completeOrder(orderId, userId);
  }

  /**
   * Buyer reports an issue with a delivered order. Escrow is flipped to
   * "disputed" and both the admin + the seller are notified.
   */
  async reportIssue(
    orderId: string,
    userId: string,
    reason: string,
    photos: string[] = [],
  ) {
    const order = await this.getOrderForBuyer(orderId, userId);
    if (!["shipped", "delivered"].includes(order.status)) {
      throw new BadRequestException(
        "Can only report issues on shipped or delivered orders",
      );
    }
    if (order.escrowStatus !== "held") {
      throw new BadRequestException(
        "Dispute can only be opened while escrow is held",
      );
    }

    const [updated] = await this.db
      .update(orders)
      .set({
        escrowStatus: "disputed",
        buyerNotes: `[DISPUTE] ${reason}\n\n${
          photos.length > 0 ? `Photos:\n${photos.join("\n")}` : ""
        }`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Notify seller
    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, order.sellerId))
      .limit(1);
    if (seller?.userId) {
      this.notificationsService
        .create({
          userId: seller.userId,
          type: "order_disputed",
          title: "Dispute opened",
          body: `Buyer reported an issue on order ${order.orderNumber}: ${reason.slice(
            0,
            80,
          )}`,
          data: { orderId: order.id },
        })
        .catch(() => {});
    }

    // Notify admins
    const admins = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"));
    for (const admin of admins) {
      this.notificationsService
        .create({
          userId: admin.id,
          type: "dispute_opened",
          title: "New dispute",
          body: `Order ${order.orderNumber} has a new dispute — review needed`,
          data: { orderId: order.id },
        })
        .catch(() => {});
    }

    return { id: updated.id, escrowStatus: updated.escrowStatus };
  }

  /**
   * Admin resolves a dispute: either release funds to seller or refund buyer.
   * Only admins can call this.
   */
  async resolveDispute(
    orderId: string,
    adminId: string,
    decision: "release" | "refund",
    notes: string,
  ) {
    const [admin] = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);
    if (!admin || admin.role !== "admin") {
      throw new ForbiddenException("Admin only");
    }

    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!order) throw new NotFoundException("Order not found");
    if (order.escrowStatus !== "disputed") {
      throw new BadRequestException("Order is not in dispute");
    }

    const now = new Date();
    const [updated] = await this.db
      .update(orders)
      .set({
        escrowStatus: decision === "release" ? "released" : "refunded",
        status: decision === "release" ? "completed" : "cancelled",
        escrowReleasedAt: decision === "release" ? now : null,
        completedAt: decision === "release" ? now : null,
        cancelledAt: decision === "refund" ? now : null,
        sellerNotes: `[ADMIN RESOLUTION: ${decision.toUpperCase()}] ${notes}`,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Update listing status
    if (decision === "release") {
      await this.db
        .update(listings)
        .set({ status: "sold", updatedAt: now })
        .where(eq(listings.id, order.listingId));
      // Seller stats
      await this.db
        .update(sellerProfiles)
        .set({
          totalSales: sql`${sellerProfiles.totalSales} + 1`,
          updatedAt: now,
        })
        .where(eq(sellerProfiles.id, order.sellerId));
    } else {
      await this.db
        .update(listings)
        .set({ status: "active", updatedAt: now })
        .where(eq(listings.id, order.listingId));
    }

    // Notify both parties
    const [seller] = await this.db
      .select({ userId: sellerProfiles.userId })
      .from(sellerProfiles)
      .where(eq(sellerProfiles.id, order.sellerId))
      .limit(1);

    const sellerBody =
      decision === "release"
        ? `Payment released — ₱${order.totalAmount}`
        : `Order refunded to buyer. Reason: ${notes.slice(0, 100)}`;
    const buyerBody =
      decision === "release"
        ? `Admin released payment to seller. Reason: ${notes.slice(0, 100)}`
        : `Your refund has been processed for order ${order.orderNumber}`;

    if (seller?.userId) {
      this.notificationsService
        .create({
          userId: seller.userId,
          type: "dispute_resolved",
          title: `Dispute ${decision}d`,
          body: sellerBody,
          data: { orderId: order.id },
        })
        .catch(() => {});
    }
    this.notificationsService
      .create({
        userId: order.buyerId,
        type: "dispute_resolved",
        title: `Dispute ${decision}d`,
        body: buyerBody,
        data: { orderId: order.id },
      })
      .catch(() => {});

    return { id: updated.id, escrowStatus: updated.escrowStatus };
  }

  private async getOrderForSeller(orderId: string, userId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) throw new NotFoundException("Order not found");

    const [seller] = await this.db
      .select()
      .from(sellerProfiles)
      .where(
        and(
          eq(sellerProfiles.id, order.sellerId),
          eq(sellerProfiles.userId, userId),
        ),
      )
      .limit(1);

    if (!seller) throw new ForbiddenException("Not your order");

    return order;
  }

  private async getOrderForBuyer(orderId: string, userId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.buyerId, userId)))
      .limit(1);

    if (!order) throw new NotFoundException("Order not found");

    return order;
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    const seq = (Number(result?.count || 0) + 1).toString().padStart(6, "0");
    return `SM-${year}${seq}`;
  }
}
