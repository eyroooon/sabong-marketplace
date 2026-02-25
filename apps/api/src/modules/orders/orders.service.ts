import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { DRIZZLE } from "../../database/database.module";
import {
  orders,
  payments,
  listings,
  sellerProfiles,
  users,
} from "../../database/schema";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/create-order.dto";

const PLATFORM_FEE_RATE = 0.05; // 5% commission

@Injectable()
export class OrdersService {
  constructor(@Inject(DRIZZLE) private db: any) {}

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

    // Validate delivery address for shipping
    if (dto.deliveryMethod === "shipping" && !dto.deliveryAddress) {
      throw new BadRequestException(
        "Delivery address is required for shipping",
      );
    }

    const itemPrice = Number(listing.price);
    const shippingFee =
      dto.deliveryMethod === "shipping"
        ? Number(listing.shippingFee || 0)
        : 0;
    const platformFee = Math.round(itemPrice * PLATFORM_FEE_RATE * 100) / 100;
    const totalAmount = itemPrice + shippingFee + platformFee;

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
        deliveryMethod: dto.deliveryMethod,
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

    return { data };
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
      .select({ id: listings.id, title: listings.title, slug: listings.slug })
      .from(listings)
      .where(eq(listings.id, order.listingId))
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

    return { ...order, listing, payments: paymentRecords, buyer, seller: sellerProfile };
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

    return { id: updated.id, status: updated.status };
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
