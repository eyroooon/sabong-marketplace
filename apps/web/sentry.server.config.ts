// Sentry configuration for the Next.js Node server runtime.
// If NEXT_PUBLIC_SENTRY_DSN is not set, Sentry becomes a no-op.
import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: Number(
      process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
    ),
  });
}
