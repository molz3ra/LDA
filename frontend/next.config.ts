import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: process.env.BACKEND_API_URL
          ? `${process.env.BACKEND_API_URL}/api/v1/:path*`
          : "http://localhost:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
