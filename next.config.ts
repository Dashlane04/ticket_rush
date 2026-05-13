import type { NextConfig } from "next";

const backend = (process.env.BACKEND_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/nest/:path*",
        destination: `${backend}/:path*`,
      },
    ];
  },
};

export default nextConfig;
