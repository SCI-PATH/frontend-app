import type { NextConfig } from "next";

const API = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";
const USER_API =
  process.env.USER_API_PROXY_TARGET || "http://127.0.0.1:8001";

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
    const learningPathRewrites = apiPaths
      .flatMap((p) => [
        { source: `/${p}/:path*`, destination: `${API}/${p}/:path*` },
        { source: `/${p}`, destination: `${API}/${p}` },
      ]);
    return [
      {
        source: "/user-api/:path*",
        destination: `${USER_API}/:path*`,
      },
      ...learningPathRewrites,
    ];
  },
};

export default nextConfig;
