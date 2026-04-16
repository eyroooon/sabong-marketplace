import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { PayMongoService } from "./paymongo.service";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PayMongoService],
  exports: [OrdersService, PayMongoService],
})
export class OrdersModule {}
