import type { NextConfig } from "next";

const API = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";

const apiPaths = [
  "health",
  "lesson",
  "debug",
  "curriculum",
  "progress",
  "client-log",
  "teacher",
  "ar-media",
  "analytics",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return apiPaths
      .flatMap((p) => [
        { source: `/${p}/:path*`, destination: `${API}/${p}/:path*` },
        { source: `/${p}`, destination: `${API}/${p}` },
      ]);
  },
};

export default nextConfig;
