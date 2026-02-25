import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export const DRIZZLE = Symbol("DRIZZLE");

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>(
          "DATABASE_URL",
          "postgresql://sabong:sabong123@localhost:5432/sabong_marketplace",
        );
        const client = postgres(url);
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
