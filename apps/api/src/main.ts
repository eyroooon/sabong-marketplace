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

  // Allow the web app + Expo dev server (web preview + physical devices via Expo Go).
  // Production adds WEB_URL (e.g. https://bloodlineph.com).
  const allowedOrigins: (string | RegExp)[] = [
    "http://localhost:3000", // Next.js web app
    "http://localhost:8081", // Expo default port
    "http://localhost:8082", // Expo alt port when 8081 is taken
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // LAN (any phone on same WiFi via Expo Go)
    /^exp:\/\/.+$/, // Expo Go deep links
  ];
  if (process.env.WEB_URL) allowedOrigins.push(process.env.WEB_URL);

  app.enableCors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. native apps, curl, Postman)
      if (!origin) return cb(null, true);
      const allowed = allowedOrigins.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin),
      );
      if (allowed) cb(null, true);
      else cb(new Error(`CORS blocked: ${origin}`), false);
    },
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
