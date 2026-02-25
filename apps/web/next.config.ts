import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sabong/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.sabongmarket.ph",
      },
    ],
  },
};

export default nextConfig;
