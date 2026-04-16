import { Module } from "@nestjs/common";
import { SellersController, AdminSellersController } from "./sellers.controller";
import { SellersService } from "./sellers.service";

@Module({
  controllers: [SellersController, AdminSellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
