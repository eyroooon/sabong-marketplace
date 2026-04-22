import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  Headers,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import { Request } from "express";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, PayOrderDto, UpdateOrderStatusDto } from "./dto/create-order.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("orders")
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  /**
   * PayMongo webhook endpoint. Must be public (no JWT) and receives the raw
   * body so we can verify the signature byte-for-byte.
   */
  @Post("webhooks/paymongo")
  @HttpCode(200)
  async paymongoWebhook(
    @Req() req: Request,
    @Headers("paymongo-signature") signature: string,
  ) {
    // main.ts registers express.json({ verify }) which stashes the raw buffer
    // on the request as `rawBody`. Fall back to re-stringifying the parsed
    // body if the raw body is missing.
    const raw =
      (req as any).rawBody instanceof Buffer
        ? (req as any).rawBody.toString("utf8")
        : JSON.stringify((req as any).body || {});
    return this.ordersService.handlePayMongoWebhook(raw, signature || "");
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getMyOrders(@CurrentUser("id") userId: string) {
    return this.ordersService.getMyOrders(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  getById(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.getById(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/pay")
  pay(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() dto: PayOrderDto,
  ) {
    return this.ordersService.payOrder(id, userId, dto.paymentMethod);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/confirm")
  confirm(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.confirmOrder(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/ship")
  ship(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.shipOrder(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/deliver")
  confirmDelivery(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.confirmDelivery(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/accept-delivery")
  acceptDelivery(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.acceptDelivery(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/dispute")
  reportIssue(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() body: { reason: string; photos?: string[] },
  ) {
    return this.ordersService.reportIssue(
      id,
      userId,
      body.reason || "No reason given",
      body.photos || [],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/complete")
  complete(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.completeOrder(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/cancel")
  cancel(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.cancelOrder(id, userId, dto);
  }
}
