import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD, APP_FILTER } from "@nestjs/core";
import { SentryModule, SentryGlobalFilter } from "@sentry/nestjs/setup";
import { validateEnv } from "./config/env.validation";
import { DatabaseModule } from "./database/database.module";
import { StorageModule } from "./common/storage/storage.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { SellersModule } from "./modules/sellers/sellers.module";
import { ListingsModule } from "./modules/listings/listings.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { FavoritesModule } from "./modules/favorites/favorites.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { VideosModule } from "./modules/videos/videos.module";
import { AdminModule } from "./modules/admin/admin.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { AiChatModule } from "./modules/ai-chat/ai-chat.module";

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 10_000,
        limit: 20,
      },
      {
        name: "default",
        ttl: 60_000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    StorageModule,
    AuthModule,
    UsersModule,
    SellersModule,
    ListingsModule,
    CategoriesModule,
    OrdersModule,
    FavoritesModule,
    NotificationsModule,
    MessagesModule,
    VideosModule,
    AdminModule,
    ReviewsModule,
    AiChatModule,
  ],
  providers: [
    // Sentry-aware global filter so thrown exceptions are captured.
    // Safe even when SENTRY_DSN is unset — Sentry.init is a no-op then.
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
