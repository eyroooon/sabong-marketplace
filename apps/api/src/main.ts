// Sentry instrumentation must be imported before anything else so it can
// patch modules on load. It is a no-op when SENTRY_DSN is not configured.
import "./instrument";

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import helmet from "helmet";
import * as express from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers
  app.use(helmet());

  // Body size limits to mitigate payload-based DoS.
  // Also capture the raw body on `req.rawBody` so webhook handlers can
  // verify provider signatures (PayMongo, etc.) byte-for-byte.
  app.use(
    express.json({
      limit: "10mb",
      verify: (req: any, _res, buf) => {
        if (buf && buf.length) req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  app.setGlobalPrefix("api");

  // Serve uploaded files (videos, images)
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads",
  });

  app.enableCors({
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
