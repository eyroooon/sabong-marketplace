import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { SellersModule } from "./modules/sellers/sellers.module";
import { ListingsModule } from "./modules/listings/listings.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { FavoritesModule } from "./modules/favorites/favorites.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MessagesModule } from "./modules/messages/messages.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    SellersModule,
    ListingsModule,
    CategoriesModule,
    OrdersModule,
    FavoritesModule,
    NotificationsModule,
    MessagesModule,
  ],
})
export class AppModule {}
