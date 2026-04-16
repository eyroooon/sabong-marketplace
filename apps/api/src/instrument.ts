/**
 * Sentry instrumentation. This file MUST be imported before any other module
 * (including Nest) so that Sentry can patch modules at load time.
 *
 * If SENTRY_DSN is not set, this module is a no-op and does not crash.
 */
import * as Sentry from "@sentry/nestjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  });
}
