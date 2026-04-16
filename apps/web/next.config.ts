import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  transpilePackages: ["@sabong/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.bloodlineph.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Wrap with Sentry only when @sentry/nextjs is actually installed. If the
// package is missing at build time (e.g. minimal CI installs), we still
// want `next build` to succeed.
let exported: NextConfig = nextConfig;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withSentryConfig } = require("@sentry/nextjs");
  exported = withSentryConfig(nextConfig, {
    // Suppress Sentry build output in the console by default.
    silent: true,
    // Upload source maps only when auth token + org/project are set.
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    // Hides source maps from the client bundle after upload.
    hideSourceMaps: true,
    disableLogger: true,
  });
} catch {
  // @sentry/nextjs not installed — fall back to the bare config.
}

export default exported;
