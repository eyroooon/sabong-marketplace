import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/create-order.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  getMyOrders(@CurrentUser("id") userId: string) {
    return this.ordersService.getMyOrders(userId);
  }

  @Get(":id")
  getById(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.getById(id, userId);
  }

  @Post()
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(userId, dto);
  }

  @Patch(":id/confirm")
  confirm(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.confirmOrder(id, userId);
  }

  @Patch(":id/ship")
  ship(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.shipOrder(id, userId, dto);
  }

  @Patch(":id/deliver")
  confirmDelivery(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.confirmDelivery(id, userId);
  }

  @Patch(":id/complete")
  complete(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.ordersService.completeOrder(id, userId);
  }

  @Patch(":id/cancel")
  cancel(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.cancelOrder(id, userId, dto);
  }
}
