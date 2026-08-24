import type { NextConfig } from "next";

/**
 * Local service ports (Docker compose):
 *   8000 LPE | 8001 UM | 8002 Gaming | 8003 Analytics | 8004 IAE
 */
const API = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";
const USER_API =
  process.env.USER_API_PROXY_TARGET || "http://127.0.0.1:8001";
const GAMING_API =
  process.env.GAMING_API_PROXY_TARGET || "http://127.0.0.1:8002";
const ASSESSMENT_API =
  process.env.ASSESSMENT_API_PROXY_TARGET || "http://127.0.0.1:8004";

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
  // LPE generate/save can exceed the default 30s rewrite proxy limit (Neon + LLM).
  experimental: {
    proxyTimeout: 240_000,
  },
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
      {
        source: "/assessment-api/:path*",
        destination: `${ASSESSMENT_API}/:path*`,
      },
      {
        source: "/api/health",
        destination: `${GAMING_API}/api/health`,
      },
      {
        source: "/api/storyline",
        destination: `${GAMING_API}/api/storyline`,
      },
      {
        source: "/api/mind-map",
        destination: `${GAMING_API}/api/mind-map`,
      },
      {
        source: "/api/avatar-chat",
        destination: `${GAMING_API}/api/avatar-chat`,
      },
      {
        source: "/api/engagement/:path*",
        destination: `${GAMING_API}/api/engagement/:path*`,
      },
      ...learningPathRewrites,
    ];
  },
};

export default nextConfig;
