import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AiChatService } from "./ai-chat.service";
import { AiChatController } from "./ai-chat.controller";
import { AiChatRateLimiter } from "./rate-limiter.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AiChatController],
  providers: [AiChatService, AiChatRateLimiter],
})
export class AiChatModule {}
