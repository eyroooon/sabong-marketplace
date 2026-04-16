import { Module } from "@nestjs/common";
import { VideosController } from "./videos.controller";
import { VideosService } from "./videos.service";
import { SellersModule } from "../sellers/sellers.module";

@Module({
  imports: [SellersModule],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
